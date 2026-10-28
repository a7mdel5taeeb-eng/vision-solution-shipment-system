-- Phase 3C.2: self-only bootstrap lookup, including administrator AAL1 onboarding.
-- Existing operational RLS/AAL2 policies and applied migrations remain unchanged.
begin;

create role vs_self_reader nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
grant vs_self_reader to postgres;
grant usage on schema public, app_private to vs_self_reader;
grant execute on function app_private.request_uid(), app_private.request_aal(),
  app_private.current_access() to vs_self_reader;
grant select (id, name, name_ar) on public.profiles to vs_self_reader;
create policy profile_self_bootstrap on public.profiles for select to vs_self_reader
  using (id = (select app_private.request_uid()));

grant create on schema public to vs_self_reader;
create function public.get_my_account() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := app_private.request_uid();
  v_role text;
  v_active boolean;
  v_profile record;
  v_aal text := app_private.request_aal();
begin
  if v_uid is null then raise insufficient_privilege using message = 'Authenticated identity required'; end if;
  select a.role, a.active into v_role, v_active from app_private.current_access() a;
  if v_role is null then return jsonb_build_object('state', 'unprovisioned'); end if;
  if not v_active then return jsonb_build_object('state', 'inactive'); end if;
  select p.id, p.name, p.name_ar into v_profile from public.profiles p where p.id = v_uid;
  if not found then return jsonb_build_object('state', 'unprovisioned'); end if;
  return jsonb_build_object('state', 'active', 'user_id', v_profile.id,
    'name', v_profile.name, 'name_ar', v_profile.name_ar, 'role', v_role,
    'aal', v_aal, 'can_operate', v_role = 'employee' or (v_role = 'admin' and v_aal = 'aal2'));
end;
$$;
alter function public.get_my_account() owner to vs_self_reader;
revoke create on schema public from vs_self_reader;
revoke all on function public.get_my_account() from public, anon, authenticated, service_role;
grant execute on function public.get_my_account() to authenticated;
comment on function public.get_my_account() is
  'Self only; protected account authority, AAL1 admin onboarding permitted; no operational rows or account mutation.';
notify pgrst, 'reload schema';
commit;
