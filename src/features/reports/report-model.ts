import { previousDayRange } from '../../shared/lib/dates.ts'
import { statusOf, type Shipment } from '../shipments/model.ts'

/** The latest effective completion is retained in history even if a shipment is reopened. */
export function effectiveCompletion(row: Shipment) {
  return (
    row.completedAt ??
    [...row.history].reverse().find((entry) => entry.completedAt)?.completedAt ??
    null
  )
}
export function dailyReport(rows: Shipment[], now: number) {
  const { start, end } = previousDayRange(now)
  const active = rows.filter((row) => !row.deletedAt)
  const inYesterday = (date: string) => Date.parse(date) >= start && Date.parse(date) < end
  return {
    start,
    end,
    started: active.filter((row) => inYesterday(row.startedAt)),
    completed: active.filter((row) => {
      const at = effectiveCompletion(row)
      return at !== null && inYesterday(at)
    }),
    overdue: active.filter((row) => statusOf(row, now) === 'overdue'),
    outstanding: active.filter((row) => row.workflow === 'pending'),
  }
}

/** UTF-8 BOM + CRLF + quoting for Excel, with formula-injection protection. */
export function toCsv(rows: readonly (readonly (string | number)[])[]) {
  const cell = (value: string | number) => {
    let text = String(value)
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  return '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n')
}
