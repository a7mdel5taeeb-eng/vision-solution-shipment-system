-- Phase 3C API response hardening. Applied Phase 3B migrations are immutable.
-- PostgREST maps SQLSTATE PT404 to HTTP 404 (rather than P0002 -> 500).
-- Identical errors for absent and non-owned records avoid enumeration and preserve rollback semantics.
-- CREATE OR REPLACE with identical signature preserves existing owner, grants and dependencies.
begin;

create or replace function public.shipment_command(
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
    if not found then raise exception using errcode = 'PT404', message = 'record_unavailable'; end if;
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
      raise exception using errcode = 'PT404', message = 'record_unavailable';
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

-- Do not broaden EXECUTE permissions or change security definer ownership.
comment on function public.shipment_command(text, uuid, uuid, bigint, jsonb, timestamptz)
  is 'Authorized shipment commands; not-owned and nonexistent IDs return uniform HTTP 404 record_unavailable';
commit;
