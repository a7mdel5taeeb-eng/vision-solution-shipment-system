begin;

-- Bounded read envelopes only. Existing invoker view/RLS, account gates and
-- command/audit contracts are unchanged. No caller-supplied clock or SQL exists.
create function public.read_operational_report(
  p_kind text default 'operations', p_search text default '', p_status text default '',
  p_owner uuid default null, p_from date default null, p_to date default null,
  p_date_field text default 'started', p_limit integer default 10, p_offset integer default 0
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_now timestamptz := statement_timestamp();
  v_end timestamptz := ((statement_timestamp() at time zone 'Asia/Riyadh')::date)::timestamp at time zone 'Asia/Riyadh';
  v_start timestamptz;
  v_result jsonb;
begin
  if not app_private.can_operate() or
    (p_kind <> 'operations' and not app_private.is_admin()) then
    raise exception using errcode='42501', message='access_denied';
  end if;
  if p_kind is null or p_kind not in ('operations','daily_starts','daily_completions','daily_overdue') or
    p_search is null or char_length(p_search)>200 or p_status is null or
    p_status not in ('','pending','overdue','completed') or
    p_date_field is null or p_date_field not in ('started','completed') or
    p_limit is null or p_limit not between 1 and 1000 or
    p_offset is null or p_offset not between 0 and 1000000 or
    (p_from is not null and (not isfinite(p_from) or p_from < date '1900-01-01' or p_from > date '9998-12-31')) or
    (p_to is not null and (not isfinite(p_to) or p_to < date '1900-01-01' or p_to > date '9998-12-31')) or
    (p_from is not null and p_to is not null and p_from>p_to) or
    (p_kind <> 'operations' and (p_search<>'' or p_status<>'' or p_owner is not null or p_from is not null or p_to is not null or p_date_field<>'started')) then
    raise exception using errcode='22023', message='invalid_report_query';
  end if;
  v_start := v_end - interval '24 hours';
  with active as materialized (
    select s.*, coalesce(s.completed_at, (
      select e.completed_at from public.shipment_events e
      where e.shipment_id=s.id and e.completed_at is not null
      order by e.revision desc limit 1
    )) as report_completed_at
    from public.shipment_overview s where s.deleted_at is null
  ), matched as materialized (
    select * from active s where
      case p_kind
        when 'daily_starts' then s.started_at>=v_start and s.started_at<v_end
        when 'daily_completions' then s.report_completed_at>=v_start and s.report_completed_at<v_end
        when 'daily_overdue' then s.status='overdue'
        else
          (p_owner is null or s.owner_id=p_owner) and
          (btrim(p_search)='' or strpos(lower(concat_ws(' ',s.id::text,s.display_id,s.customer,s.origin,s.destination,s.truck,s.driver,s.cargo,s.driver_phone,s.invoice_number,s.notes)),lower(btrim(p_search)))>0) and
          (p_from is null or (case p_date_field when 'started' then s.started_at else s.report_completed_at end)>=(p_from::timestamp at time zone 'Asia/Riyadh')) and
          (p_to is null or (case p_date_field when 'started' then s.started_at else s.report_completed_at end)<((p_to+1)::timestamp at time zone 'Asia/Riyadh'))
      end
  ), filtered as materialized (
    select * from matched where p_status='' or status=p_status
  ), page as (
    select * from filtered order by
      case when p_kind='daily_overdue' then started_at end asc,
      case when p_kind<>'daily_overdue' then started_at end desc, id
    limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'rows',coalesce((select jsonb_agg(to_jsonb(p) order by
      case when p_kind='daily_overdue' then p.started_at end asc,
      case when p_kind<>'daily_overdue' then p.started_at end desc,p.id) from page p),'[]'::jsonb),
    'total',(select count(*)::text from filtered),
    'counts',(select jsonb_build_object('total',count(*)::text,
      'pending',count(*) filter(where status='pending')::text,
      'overdue',count(*) filter(where status='overdue')::text,
      'completed',count(*) filter(where status='completed')::text) from matched),
    'daily_counts',case when p_kind='operations' then null else
      (select jsonb_build_object('daily_starts',count(*) filter(where started_at>=v_start and started_at<v_end)::text,
        'daily_completions',count(*) filter(where report_completed_at>=v_start and report_completed_at<v_end)::text,
        'daily_overdue',count(*) filter(where status='overdue')::text) from active) end,
    'server_now',v_now,'period_start',v_start,'period_end',v_end,
    'intended_delivery_at',v_end+interval '8 hours','kind',p_kind) into v_result;
  return v_result;
end;
$$;
revoke all on function public.read_operational_report(text,text,text,uuid,date,date,text,integer,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.read_operational_report(text,text,text,uuid,date,date,text,integer,integer) to authenticated;
comment on function public.read_operational_report(text,text,text,uuid,date,date,text,integer,integer)
  is '3C.5 bounded invoker reports: RLS, Riyadh dates, admin-only daily preview; no delivery or scheduling';
notify pgrst,'reload schema';
commit;
