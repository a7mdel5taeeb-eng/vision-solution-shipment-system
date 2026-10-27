const RIYADH_OFFSET = 3 * 3_600_000
export function dateKey(value: string | number) {
  return new Date(new Date(value).getTime() + RIYADH_OFFSET).toISOString().slice(0, 10)
}
export function dateTimeInput(value: string | number) {
  return new Date(new Date(value).getTime() + RIYADH_OFFSET).toISOString().slice(0, 19)
}
export function fromRiyadhInput(value: string) {
  return value ? `${value.length === 16 ? `${value}:00` : value}+03:00` : ''
}
export function formatDate(value: string | number, locale: string, withTime = true) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
    timeZone: 'Asia/Riyadh',
  }).format(new Date(value))
}
export function previousDayRange(now: number) {
  const end = Date.parse(`${dateKey(now)}T00:00:00+03:00`)
  return { start: end - 86_400_000, end }
}
export function inDateRange(timestamp: string, from: string, to: string) {
  const value = Date.parse(timestamp)
  return (
    (!from || value >= Date.parse(`${from}T00:00:00+03:00`)) &&
    (!to || value < Date.parse(`${to}T00:00:00+03:00`) + 86_400_000)
  )
}
