begin;

create function app_private.validate_fields(p_fields jsonb) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_key text;
  v_value text;
  v_result jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_fields) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'invalid_fields';
  end if;
  for v_key in select jsonb_object_keys(p_fields) loop
    if v_key <> all(array['customer','origin','destination','truck','driver','cargo','driver_phone','invoice_number','notes']) then
      raise exception using errcode = '22023', message = 'unknown_field';
    end if;
    if jsonb_typeof(p_fields->v_key) not in ('string', 'null') then
      raise exception using errcode = '22023', message = 'invalid_field_type';
    end if;
  end loop;
  foreach v_key in array array['customer','origin','destination','truck','driver','cargo','driver_phone','invoice_number','notes'] loop
    v_value := nullif(app_private.trim_text(p_fields->>v_key), '');
    if v_key = any(array['customer','origin','destination','truck','driver','cargo']) and
      (v_value is null or app_private.text_length(v_value) > 200) then
      raise exception using errcode = '22023', message = 'invalid_required_field';
    end if;
    if (v_key = 'invoice_number' and app_private.text_length(v_value) > 100) or
       (v_key = 'notes' and app_private.text_length(v_value) > 2000) or
       (v_key = 'driver_phone' and not app_private.valid_phone(v_value)) then
      raise exception using errcode = '22023', message = 'invalid_optional_field';
    end if;
    v_result := v_result || jsonb_build_object(v_key, v_value);
  end loop;
  return v_result;
end;
$$;

create function app_private.shipment_status(p_workflow text, p_started_at timestamptz, p_at timestamptz)
returns text language sql immutable strict set search_path = '' as $$
  select case when p_workflow = 'completed' then 'completed'
    when p_at > p_started_at + interval '96 hours' then 'overdue' else 'pending' end;
$$;
create function app_private.guard_shipment_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.number is distinct from old.number or
    new.owner_id is distinct from old.owner_id or new.started_at is distinct from old.started_at then
    raise exception using errcode = '42501', message = 'immutable_shipment_identity';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception using errcode = '40001', message = 'invalid_shipment_revision';
  end if;
  return new;
end;
$$;
create trigger immutable_shipment_identity before update on public.shipments
  for each row execute function app_private.guard_shipment_identity();

-- The API caller is authenticated, but only this non-owner role has table DML.
grant create on schema public to vs_command_writer;
create function public.shipment_command(
  p_operation text,
  p_request_id uuid,
  p_shipment_id uuid default null,
  p_expected_revision bigint default null,
  p_fields jsonb default '{}',
  p_completed_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := app_private.request_uid();
  v_row public.shipments%rowtype;
  v_receipt app_private.command_receipts%rowtype;
  v_fields jsonb;
  v_fingerprint text;
  v_result jsonb;
  v_now timestamptz;
  v_action text;
  v_changed text[] := '{}'::text[];
  v_key text;
begin
  if v_actor is null or not app_private.can_operate() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if p_operation is null or p_operation <> all(array['create','update','complete','reopen','delete','restore']) or p_request_id is null then
    raise exception using errcode = '22023', message = 'invalid_command';
  end if;
  if p_operation in ('delete', 'restore') and not app_private.is_admin() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if (p_operation = 'create' and (p_shipment_id is not null or p_expected_revision is not null)) or
    (p_operation <> 'create' and (p_shipment_id is null or p_expected_revision is null or p_expected_revision < 1)) or
    (p_operation <> 'complete' and p_completed_at is not null) or
    (p_operation not in ('create','update') and p_fields is distinct from '{}'::jsonb) then
    raise exception using errcode = '22023', message = 'invalid_command_parameters';
  end if;
  v_fingerprint := encode(sha256(convert_to(jsonb_build_object('operation', p_operation,
    'shipment_id', p_shipment_id, 'revision', p_expected_revision, 'fields', p_fields,
    'completed_epoch', extract(epoch from p_completed_at))::text, 'UTF8')), 'hex');
  -- Serialize duplicate requests, not all shipments. Hash collisions only serialize extra work.
  perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':' || p_request_id::text, 0));
  select * into v_receipt from app_private.command_receipts
    where actor_id = v_actor and request_id = p_request_id;
  if found then
    if v_receipt.fingerprint <> v_fingerprint then
      raise exception using errcode = '22023', message = 'idempotency_key_reused';
    end if;
    perform 1 from public.shipments where id = v_receipt.shipment_id;
    if not found then raise exception using errcode = 'P0002', message = 'record_unavailable'; end if;
    return v_receipt.result;
  end if;

  v_now := date_trunc('second', clock_timestamp());
  if p_operation in ('create','update') then v_fields := app_private.validate_fields(p_fields); end if;
  if p_operation = 'create' then
    insert into public.shipments(owner_id, customer, origin, destination, truck, driver, cargo,
      driver_phone, invoice_number, notes, started_at, updated_at)
    values (v_actor, v_fields->>'customer', v_fields->>'origin', v_fields->>'destination',
      v_fields->>'truck', v_fields->>'driver', v_fields->>'cargo', v_fields->>'driver_phone',
      v_fields->>'invoice_number', v_fields->>'notes', v_now, v_now) returning * into v_row;
    v_action := 'created';
  else
    -- RLS limits visible rows; explicit authorization protects the command contract too.
    select * into v_row from public.shipments where id = p_shipment_id for update;
    if not found or (not app_private.is_admin() and v_row.owner_id <> v_actor) then
      raise exception using errcode = 'P0002', message = 'record_unavailable';
    end if;
    if v_row.deleted_at is not null and p_operation <> 'restore' then
      raise exception using errcode = '42501', message = 'record_unavailable';
    end if;
    if v_row.revision <> p_expected_revision then
      raise exception using errcode = '40001', message = 'shipment_conflict';
    end if;
    case p_operation
      when 'update' then
        for v_key in select jsonb_object_keys(v_fields) loop
          if (to_jsonb(v_row)->v_key) is distinct from (v_fields->v_key) then
            v_changed := array_append(v_changed, v_key);
          end if;
        end loop;
        update public.shipments set customer = v_fields->>'customer', origin = v_fields->>'origin',
          destination = v_fields->>'destination', truck = v_fields->>'truck', driver = v_fields->>'driver',
          cargo = v_fields->>'cargo', driver_phone = v_fields->>'driver_phone',
          invoice_number = v_fields->>'invoice_number', notes = v_fields->>'notes',
          revision = revision + 1, updated_at = v_now where id = v_row.id returning * into v_row;
        v_action := 'updated';
      when 'complete' then
        if p_completed_at is null or not isfinite(p_completed_at) or
          p_completed_at < v_row.started_at or p_completed_at > clock_timestamp() then
          raise exception using errcode = '22023', message = 'invalid_completion';
        end if;
        v_action := case when v_row.workflow = 'completed' then 'completionEdited' else 'completed' end;
        update public.shipments set workflow = 'completed', completed_at = p_completed_at,
          revision = revision + 1, updated_at = v_now where id = v_row.id returning * into v_row;
      when 'reopen' then
        if v_row.workflow <> 'completed' then
          raise exception using errcode = '22023', message = 'invalid_reopen';
        end if;
        update public.shipments set workflow = 'pending', completed_at = null,
          revision = revision + 1, updated_at = v_now where id = v_row.id returning * into v_row;
        v_action := 'reopened';
      when 'delete' then
        update public.shipments set deleted_at = v_now, deleted_by = v_actor,
          revision = revision + 1, updated_at = v_now where id = v_row.id returning * into v_row;
        v_action := 'deleted';
      when 'restore' then
        if v_row.deleted_at is null then
          raise exception using errcode = '22023', message = 'invalid_restore';
        end if;
        update public.shipments set deleted_at = null, deleted_by = null,
          revision = revision + 1, updated_at = v_now where id = v_row.id returning * into v_row;
        v_action := 'restored';
    end case;
  end if;

  insert into public.shipment_events(shipment_id, actor_id, occurred_at, action, revision, changed_fields, completed_at)
  values (v_row.id, v_actor, v_now, v_action, v_row.revision, v_changed,
    case when v_action in ('completed','completionEdited') then v_row.completed_at else null end);
  v_result := jsonb_build_object('shipment_id', v_row.id, 'number', v_row.number::text,
    'revision', v_row.revision::text, 'started_at', v_row.started_at, 'action', v_action);
  insert into app_private.command_receipts(actor_id, request_id, operation, fingerprint, shipment_id, result)
    values (v_actor, p_request_id, p_operation, v_fingerprint, v_row.id, v_result);
  return v_result;
end;
$$;
alter function public.shipment_command(text, uuid, uuid, bigint, jsonb, timestamptz) owner to vs_command_writer;
revoke create on schema public from vs_command_writer;

-- No client-supplied clock influences operational status. Bigints cross JSON as strings.
create view public.shipment_overview with (security_invoker = true) as
  select s.id, s.number::text as number,
    'TR-' || lpad(s.number::text, greatest(4, length(s.number::text)), '0') as display_id,
    s.owner_id, s.customer, s.origin, s.destination, s.truck, s.driver, s.cargo,
    s.driver_phone, s.invoice_number, s.notes, s.started_at, s.workflow, s.completed_at,
    s.deleted_at, s.deleted_by, s.updated_at, s.revision::text as revision,
    app_private.shipment_status(s.workflow, s.started_at, statement_timestamp()) as status,
    statement_timestamp() as server_now
  from public.shipments s;
revoke all on public.shipment_overview from public, anon, authenticated, service_role;
grant select on public.shipment_overview to authenticated;

create function public.get_shipments(p_id uuid default null, p_limit integer default 20, p_offset integer default 0)
returns setof public.shipment_overview
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not app_private.can_operate() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if p_limit is null or p_limit not between 1 and 100 or p_offset is null or p_offset < 0 then
    raise exception using errcode = '22023', message = 'invalid_pagination';
  end if;
  return query select * from public.shipment_overview s
    where p_id is null or s.id = p_id order by s.started_at desc, s.id limit p_limit offset p_offset;
end;
$$;
create function public.get_shipment_history(p_shipment_id uuid, p_limit integer default 100, p_offset integer default 0)
returns table(id uuid, shipment_id uuid, actor_id uuid, occurred_at timestamptz,
  action text, revision text, changed_fields text[], completed_at timestamptz)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not app_private.can_operate() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if p_shipment_id is null or p_limit is null or p_limit not between 1 and 500 or p_offset is null or p_offset < 0 then
    raise exception using errcode = '22023', message = 'invalid_pagination';
  end if;
  return query select e.id, e.shipment_id, e.actor_id, e.occurred_at, e.action,
    e.revision::text, e.changed_fields, e.completed_at from public.shipment_events e
    where e.shipment_id = p_shipment_id order by e.revision, e.id limit p_limit offset p_offset;
end;
$$;

revoke all on function public.shipment_command(text, uuid, uuid, bigint, jsonb, timestamptz),
  public.get_shipments(uuid, integer, integer), public.get_shipment_history(uuid, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.shipment_command(text, uuid, uuid, bigint, jsonb, timestamptz),
  public.get_shipments(uuid, integer, integer), public.get_shipment_history(uuid, integer, integer) to authenticated;
revoke all on function app_private.validate_fields(jsonb), app_private.shipment_status(text, timestamptz, timestamptz),
  app_private.guard_shipment_identity() from public, anon, authenticated, service_role;
grant execute on function app_private.validate_fields(jsonb) to vs_command_writer;
grant execute on function app_private.shipment_status(text, timestamptz, timestamptz) to authenticated, vs_command_writer;

comment on function public.shipment_command(text, uuid, uuid, bigint, jsonb, timestamptz)
  is 'Phase 3B candidate: atomic authorized shipment mutation, CAS revision, audit and retry receipt; no external services';
commit;
