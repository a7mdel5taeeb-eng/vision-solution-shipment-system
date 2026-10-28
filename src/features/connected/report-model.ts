import {
  parseReadPage,
  parseShipment,
  uuid,
  type ReadPage,
  type ReadShipment,
} from './read-model.ts'

export const EXPORT_LIMIT = 1000
export type ReportKind = 'operations' | 'daily_starts' | 'daily_completions' | 'daily_overdue'
export type ReportQuery = {
  kind: ReportKind
  search: string
  status: '' | 'pending' | 'overdue' | 'completed'
  owner: string
  from: string
  to: string
  dateField: 'started' | 'completed'
  limit: number
  offset: number
}
export const reportDefaults: ReportQuery = {
  kind: 'operations',
  search: '',
  status: '',
  owner: '',
  from: '',
  to: '',
  dateField: 'started',
  limit: 10,
  offset: 0,
}
export type ReportRow = ReadShipment & { report_completed_at: string | null }
export type ReportPage = Omit<ReadPage, 'rows'> & {
  rows: ReportRow[]
  kind: ReportKind
  daily_counts: Record<Exclude<ReportKind, 'operations'>, string> | null
  period_start: string
  period_end: string
  intended_delivery_at: string
}
const validDay = (s: string) =>
  !s ||
  (/^\d{4}-\d\d-\d\d$/.test(s) &&
    s >= '1900-01-01' &&
    s <= '9998-12-31' &&
    new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s)
export function validReportQuery(q: ReportQuery) {
  try {
    return (
      ['operations', 'daily_starts', 'daily_completions', 'daily_overdue'].includes(q.kind) &&
      typeof q.search === 'string' &&
      q.search.length <= 200 &&
      ['', 'pending', 'completed', 'overdue'].includes(q.status) &&
      (!q.owner || uuid(q.owner)) &&
      validDay(q.from) &&
      validDay(q.to) &&
      (!q.from || !q.to || q.from <= q.to) &&
      ['started', 'completed'].includes(q.dateField) &&
      Number.isInteger(q.limit) &&
      q.limit >= 1 &&
      q.limit <= EXPORT_LIMIT &&
      Number.isInteger(q.offset) &&
      q.offset >= 0 &&
      q.offset <= 1000000 &&
      (q.kind === 'operations' ||
        (!q.search && !q.status && !q.owner && !q.from && !q.to && q.dateField === 'started'))
    )
  } catch {
    return false
  }
}
export function parseReportPage(value: unknown, kind: ReportKind): ReportPage {
  const p = value as ReportPage
  if (!p || !Array.isArray(p.rows) || p.rows.length > EXPORT_LIMIT || p.kind !== kind)
    throw new Error('Invalid report envelope')
  const base = parseReadPage({ ...p, rows: [] })
  for (const time of [p.period_start, p.period_end, p.intended_delivery_at])
    if (typeof time !== 'string' || !Number.isFinite(Date.parse(time)))
      throw new Error('Invalid report period')
  if (
    Date.parse(p.period_end) - Date.parse(p.period_start) !== 86400000 ||
    Date.parse(p.intended_delivery_at) - Date.parse(p.period_end) !== 28800000
  )
    throw new Error('Invalid report period')
  if (
    kind === 'operations'
      ? p.daily_counts !== null
      : !p.daily_counts ||
        !['daily_starts', 'daily_completions', 'daily_overdue'].every(
          (k) =>
            typeof p.daily_counts![k as keyof typeof p.daily_counts] === 'string' &&
            /^(0|[1-9]\d*)$/.test(p.daily_counts![k as keyof typeof p.daily_counts]),
        )
  )
    throw new Error('Invalid daily counts')
  if (
    BigInt(p.total) < BigInt(p.rows.length) ||
    BigInt(p.counts.total) !==
      BigInt(p.counts.pending) + BigInt(p.counts.overdue) + BigInt(p.counts.completed)
  )
    throw new Error('Inconsistent report counts')
  const rows = p.rows.map((r) => {
    const row = parseShipment(r)
    if (
      row.deleted_at ||
      !(
        r.report_completed_at === null ||
        (typeof r.report_completed_at === 'string' &&
          Number.isFinite(Date.parse(r.report_completed_at)))
      )
    )
      throw new Error('Invalid report row')
    return { ...row, report_completed_at: r.report_completed_at }
  })
  return {
    ...base,
    rows,
    kind,
    daily_counts: p.daily_counts,
    period_start: p.period_start,
    period_end: p.period_end,
    intended_delivery_at: p.intended_delivery_at,
  }
}
/** Spreadsheet text export: prefix EVERY cell, quote separators/newlines, preserve int64 digits.
 * The apostrophe is an intentional safety marker, not part of the stored database value.
 */
export function reportCsv(headers: readonly string[], rows: readonly ReportRow[]) {
  if (rows.length > EXPORT_LIMIT) throw new Error('Export limit exceeded')
  const cell = (s: string) => `"'${s.replaceAll('"', '""')}"`
  const data = rows.map((r) => [
    r.display_id,
    r.id,
    r.number,
    r.revision,
    r.owner_id,
    r.customer,
    r.origin,
    r.destination,
    r.truck,
    r.driver,
    r.driver_phone ?? '',
    r.cargo,
    r.invoice_number ?? '',
    r.notes ?? '',
    r.started_at,
    r.report_completed_at ?? '',
    r.status,
  ])
  return '\ufeff' + [headers, ...data].map((r) => r.map(cell).join(',')).join('\r\n')
}
