begin;

-- Read-only envelopes. All source rows still pass the existing invoker view/RLS;
-- no new role, policy, table grant, command or client-supplied clock is introduced.
create function public.read_shipment_page(
  p_search text default '', p_status text default '', p_scope text default 'active',
  p_owner uuid default null, p_sort text default 'newest',
  p_limit integer default 10, p_offset integer default 0
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare v_result jsonb;
begin
  if not app_private.can_operate() or
    (p_scope = 'deleted' and not app_private.is_admin()) then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if p_search is null or char_length(p_search) > 200 or p_status is null or
    p_status not in ('', 'pending', 'overdue', 'completed') or p_scope is null or
    p_scope not in ('active', 'deleted') or p_sort is null or
    p_sort not in ('newest', 'oldest') or p_limit is null or p_limit not between 1 and 100 or
    p_offset is null or p_offset not between 0 and 1000000 then
    raise exception using errcode = '22023', message = 'invalid_read_query';
  end if;
  with matched as materialized (
    select s.* from public.shipment_overview s
    where (s.deleted_at is not null) = (p_scope = 'deleted')
      and (p_owner is null or s.owner_id = p_owner)
      -- Literal substring search: %, _ and SQL syntax have no special meaning.
      and (btrim(p_search) = '' or strpos(lower(concat_ws(' ', s.id::text,
        s.display_id, s.customer, s.origin, s.destination, s.truck, s.driver,
        s.cargo, s.driver_phone, s.invoice_number, s.notes)), lower(btrim(p_search))) > 0)
  ), filtered as materialized (
    select * from matched where p_status = '' or status = p_status
  ), page as (
    select * from filtered order by
      case when p_sort = 'newest' then started_at end desc,
      case when p_sort = 'oldest' then started_at end asc, id
    limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(p) order by
      case when p_sort = 'newest' then p.started_at end desc,
      case when p_sort = 'oldest' then p.started_at end asc, p.id) from page p), '[]'::jsonb),
    'total', (select count(*)::text from filtered),
    'counts', (select jsonb_build_object('total', count(*)::text,
      'pending', count(*) filter (where status = 'pending')::text,
      'overdue', count(*) filter (where status = 'overdue')::text,
      'completed', count(*) filter (where status = 'completed')::text) from matched),
    'server_now', statement_timestamp()) into v_result;
  return v_result;
end;
$$;

create function public.read_shipment_history_page(
  p_shipment_id uuid, p_limit integer default 20, p_offset integer default 0
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare v_result jsonb;
begin
  if not app_private.can_operate() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if p_shipment_id is null or p_limit is null or p_limit not between 1 and 100 or
    p_offset is null or p_offset not between 0 and 1000000 then
    raise exception using errcode = '22023', message = 'invalid_read_query';
  end if;
  -- Identical response for absent and RLS-invisible UUIDs.
  if not exists (select 1 from public.shipments where id = p_shipment_id) then
    raise exception using errcode = 'PT404', message = 'record_unavailable';
  end if;
  select jsonb_build_object('rows', coalesce((select jsonb_agg(to_jsonb(p) order by p.revision::bigint, p.id)
    from (select e.id, e.shipment_id, e.actor_id, e.occurred_at, e.action,
      e.revision::text as revision, e.changed_fields, e.completed_at
      from public.shipment_events e where e.shipment_id = p_shipment_id
      order by e.revision, e.id limit p_limit offset p_offset) p), '[]'::jsonb),
    'total', (select count(*)::text from public.shipment_events where shipment_id = p_shipment_id),
    'server_now', statement_timestamp()) into v_result;
  return v_result;
end;
$$;

revoke all on function public.read_shipment_page(text,text,text,uuid,text,integer,integer),
  public.read_shipment_history_page(uuid,integer,integer) from public, anon, authenticated, service_role;
grant execute on function public.read_shipment_page(text,text,text,uuid,text,integer,integer),
  public.read_shipment_history_page(uuid,integer,integer) to authenticated;
comment on function public.read_shipment_page(text,text,text,uuid,text,integer,integer)
  is '3C.3 bounded RLS invoker read, literal search, server-clock statuses and string counts';
notify pgrst, 'reload schema';
commit;
