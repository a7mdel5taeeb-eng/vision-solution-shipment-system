-- Phase 3B candidate: local database execution/review is required before approval.
begin;

create role vs_access_reader nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
create role vs_command_writer nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
-- Migration operators can assign function ownership; API roles receive no membership.
grant vs_access_reader, vs_command_writer to postgres;

create schema app_private;
revoke all on schema app_private from public, anon, authenticated, service_role;
revoke create on schema public from public, anon, authenticated, service_role;
grant usage on schema public, app_private to vs_access_reader, vs_command_writer;
grant usage on schema app_private to authenticated;

-- GoTrue startup owns/reconciles auth-schema grants. Custom roles use narrow
-- context-only wrappers owned by the migration role; these never query tables.
create function app_private.request_uid() returns uuid
language sql stable security definer set search_path = '' as $$ select auth.uid(); $$;
create function app_private.request_aal() returns text
language sql stable security definer set search_path = '' as $$ select auth.jwt()->>'aal'; $$;

-- Match JavaScript trim and UTF-16 length limits without changing the frontend.
create function app_private.trim_text(p_value text) returns text
language sql immutable strict set search_path = '' as $$
  select btrim(p_value, E' \t\n\r\f' || chr(11) ||
    U&'\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff');
$$;
create function app_private.text_length(p_value text) returns integer
language sql immutable strict set search_path = '' as $$
  select char_length(p_value) + char_length(regexp_replace(p_value, U&'[^\+010000-\+10ffff]', '', 'g'));
$$;
create function app_private.valid_phone(p_value text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_number text;
  v_digits text;
begin
  if p_value is null or app_private.trim_text(p_value) = '' then return true; end if;
  if app_private.text_length(p_value) > 64 then return false; end if;
  v_number := translate(app_private.trim_text(p_value), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  v_number := app_private.trim_text(regexp_replace(v_number,
    '(\s*(ext\.?|x|#|;ext=)\s*[0-9]{1,10})$', '', 'i'));
  if v_number !~ '^\+?[0-9[:space:]().-]+$' then return false; end if;
  if v_number ~ '^(\+|00)' then
    v_number := regexp_replace(v_number, '\(\s*0\s*\)', '', 'g');
  end if;
  v_digits := regexp_replace(regexp_replace(v_number, '[^0-9]', '', 'g'), '^00', '');
  return char_length(v_digits) between 7 and 15;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  name text not null check (app_private.text_length(app_private.trim_text(name)) between 1 and 200),
  name_ar text check (app_private.text_length(name_ar) <= 200),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);
create table app_private.account_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete restrict,
  role text not null check (role in ('admin', 'employee')),
  active boolean not null default false,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default statement_timestamp()
);
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  customer text not null check (app_private.text_length(customer) between 1 and 200 and customer = app_private.trim_text(customer)),
  origin text not null check (app_private.text_length(origin) between 1 and 200 and origin = app_private.trim_text(origin)),
  destination text not null check (app_private.text_length(destination) between 1 and 200 and destination = app_private.trim_text(destination)),
  truck text not null check (app_private.text_length(truck) between 1 and 200 and truck = app_private.trim_text(truck)),
  driver text not null check (app_private.text_length(driver) between 1 and 200 and driver = app_private.trim_text(driver)),
  cargo text not null check (app_private.text_length(cargo) between 1 and 200 and cargo = app_private.trim_text(cargo)),
  driver_phone text check (app_private.valid_phone(driver_phone)),
  invoice_number text check (app_private.text_length(invoice_number) <= 100),
  notes text check (app_private.text_length(notes) <= 2000),
  started_at timestamptz not null default date_trunc('second', clock_timestamp()) check (isfinite(started_at)),
  workflow text not null default 'pending' check (workflow in ('pending', 'completed')),
  completed_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default statement_timestamp(),
  revision bigint not null default 1 check (revision > 0),
  check ((workflow = 'pending' and completed_at is null) or
    (workflow = 'completed' and completed_at is not null and isfinite(completed_at) and completed_at >= started_at)),
  check ((deleted_at is null) = (deleted_by is null)),
  check (number > 0)
);
create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default statement_timestamp(),
  action text not null check (action in ('created', 'updated', 'completed', 'completionEdited', 'reopened', 'deleted', 'restored')),
  revision bigint not null check (revision > 0),
  changed_fields text[] not null default '{}',
  completed_at timestamptz,
  unique (shipment_id, revision),
  check ((action in ('completed', 'completionEdited')) = (completed_at is not null))
);
create table public.invoice_files (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  object_key text not null unique check (char_length(object_key) between 1 and 500),
  detected_mime text check (detected_mime in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size integer check (byte_size between 1 and 768000),
  checksum_sha256 text check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  state text not null default 'pending' check (state in ('pending', 'available', 'rejected', 'retired')),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (state <> 'available' or (detected_mime is not null and byte_size is not null and checksum_sha256 is not null))
);
create unique index one_current_invoice on public.invoice_files(shipment_id) where state = 'available';
create table public.report_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  enabled boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);
create table public.admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  target_id uuid,
  action text not null check (char_length(action) between 1 and 100),
  occurred_at timestamptz not null default statement_timestamp(),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object')
);
create table app_private.command_receipts (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  request_id uuid not null,
  operation text not null,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  result jsonb not null,
  created_at timestamptz not null default statement_timestamp(),
  unique (actor_id, request_id)
);
create index shipments_owner_start on public.shipments(owner_id, started_at desc, id);
create index shipments_open_start on public.shipments(started_at, id) where workflow = 'pending' and deleted_at is null;
create index shipments_completion on public.shipments(completed_at) where deleted_at is null;
create index shipments_deleted on public.shipments(deleted_at) where deleted_at is not null;
create index shipment_events_actor on public.shipment_events(actor_id);
create index invoice_files_uploader on public.invoice_files(uploaded_by);
create index receipts_shipment on app_private.command_receipts(shipment_id);
create index admin_events_actor on public.admin_events(actor_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table app_private.account_access enable row level security;
alter table app_private.account_access force row level security;
alter table public.shipments enable row level security;
alter table public.shipments force row level security;
alter table public.shipment_events enable row level security;
alter table public.shipment_events force row level security;
alter table public.invoice_files enable row level security;
alter table public.invoice_files force row level security;
alter table public.report_recipients enable row level security;
alter table public.report_recipients force row level security;
alter table public.admin_events enable row level security;
alter table public.admin_events force row level security;
alter table app_private.command_receipts enable row level security;
alter table app_private.command_receipts force row level security;

revoke all on public.profiles, public.shipments, public.shipment_events, public.invoice_files,
  public.report_recipients, public.admin_events from public, anon, authenticated, service_role;
revoke all on all tables in schema app_private from public, anon, authenticated, service_role;
revoke all on sequence public.shipments_number_seq from public, anon, authenticated, service_role;
grant select on public.profiles, public.shipments, public.shipment_events, public.invoice_files,
  public.report_recipients, public.admin_events to authenticated;
grant select on app_private.account_access to vs_access_reader;
create policy access_reader_self on app_private.account_access for select to vs_access_reader
  using (user_id = (select app_private.request_uid()));

-- Only this reader may inspect the caller's protected role; it cannot change roles.
grant create on schema app_private to vs_access_reader;
create function app_private.current_access() returns table(role text, active boolean)
language sql stable security definer set search_path = '' as $$
  select a.role, a.active from app_private.account_access a where a.user_id = (select app_private.request_uid());
$$;
alter function app_private.current_access() owner to vs_access_reader;
revoke create on schema app_private from vs_access_reader;
create function app_private.can_operate() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select a.active and (a.role = 'employee' or
    (a.role = 'admin' and app_private.request_aal() = 'aal2')) from app_private.current_access() a), false);
$$;
create function app_private.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select a.active and a.role = 'admin' and app_private.request_aal() = 'aal2'
    from app_private.current_access() a), false);
$$;

create policy profile_read on public.profiles for select to authenticated
  using (app_private.can_operate() and (id = (select app_private.request_uid()) or app_private.is_admin()));
create policy shipment_read on public.shipments for select to authenticated, vs_command_writer
  using (app_private.can_operate() and (app_private.is_admin() or (owner_id = (select app_private.request_uid()) and deleted_at is null)));
create policy shipment_create on public.shipments for insert to vs_command_writer
  with check (app_private.can_operate() and owner_id = (select app_private.request_uid()));
create policy shipment_update on public.shipments for update to vs_command_writer
  using (app_private.can_operate() and (app_private.is_admin() or (owner_id = (select app_private.request_uid()) and deleted_at is null)))
  with check (app_private.can_operate() and (app_private.is_admin() or (owner_id = (select app_private.request_uid()) and deleted_at is null)));
create policy event_read on public.shipment_events for select to authenticated, vs_command_writer
  using (exists (select 1 from public.shipments s where s.id = shipment_id));
create policy event_append on public.shipment_events for insert to vs_command_writer
  with check (app_private.can_operate() and actor_id = (select app_private.request_uid()) and
    exists (select 1 from public.shipments s where s.id = shipment_id and s.revision = shipment_events.revision));
create policy invoice_read on public.invoice_files for select to authenticated
  using (exists (select 1 from public.shipments s where s.id = shipment_id));
create policy recipients_read on public.report_recipients for select to authenticated using (app_private.is_admin());
create policy admin_events_read on public.admin_events for select to authenticated using (app_private.is_admin());
create policy receipt_read on app_private.command_receipts for select to vs_command_writer
  using (app_private.can_operate() and actor_id = (select app_private.request_uid()));
create policy receipt_append on app_private.command_receipts for insert to vs_command_writer
  with check (app_private.can_operate() and actor_id = (select app_private.request_uid()) and
    exists (select 1 from public.shipments s where s.id = shipment_id));

grant select, insert on public.shipments to vs_command_writer;
grant update (customer, origin, destination, truck, driver, cargo, driver_phone, invoice_number, notes,
  workflow, completed_at, deleted_at, deleted_by, updated_at, revision) on public.shipments to vs_command_writer;
grant usage on sequence public.shipments_number_seq to vs_command_writer;
grant select, insert on public.shipment_events, app_private.command_receipts to vs_command_writer;

-- The pure validators are also needed by CHECK constraints and read-side policies.
revoke all on all functions in schema app_private from public, anon, authenticated, service_role;
grant execute on function app_private.trim_text(text), app_private.text_length(text), app_private.valid_phone(text),
  app_private.current_access(), app_private.can_operate(), app_private.is_admin() to authenticated, vs_command_writer;
grant execute on function app_private.request_uid(), app_private.request_aal() to authenticated, vs_command_writer, vs_access_reader;

comment on schema app_private is 'Phase 3B: private authorization and idempotency; never expose via Data API schemas';
commit;
