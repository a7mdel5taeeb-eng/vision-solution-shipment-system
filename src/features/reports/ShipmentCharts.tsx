import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { dateKey } from '../../shared/lib/dates'
import { shipmentTotals, type Shipment } from '../shipments/model'

export function DistributionChart({
  rows,
  now,
  interactive = false,
}: {
  rows: Shipment[]
  now: number
  interactive?: boolean
}) {
  const { t, locale } = useLocale()
  const totals = shipmentTotals(rows, now)
  const completed = totals.total ? (totals.completed / totals.total) * 100 : 0
  const pending = totals.total ? (totals.pending / totals.total) * 100 : 0
  const gradient = totals.total
    ? `conic-gradient(#20a47e 0% ${completed}%, #e9b442 ${completed}% ${completed + pending}%, #e25a66 ${completed + pending}% 100%)`
    : 'var(--border)'
  const number = new Intl.NumberFormat(locale)
  return (
    <section className="panel chart-panel">
      <div className="chart-heading">
        <h2>{t.statusDistribution}</h2>
        <span>{t.fictionalData}</span>
      </div>
      <div className="distribution-content">
        <div className="donut-chart" style={{ background: gradient }} aria-hidden="true">
          <div>
            <strong>{number.format(totals.total)}</strong>
            <span>{t.shipmentsUnit}</span>
          </div>
        </div>
        <ul className="chart-legend">
          {(['completed', 'pending', 'overdue'] as const).map((status) => (
            <li key={status}>
              {interactive ? (
                <Link to={`/shipments?status=${status}`}>
                  <i className={`legend-${status}`} />
                  <span>{t[status]}</span>
                  <strong>{number.format(totals[status])}</strong>
                </Link>
              ) : (
                <div>
                  <i className={`legend-${status}`} />
                  <span>{t[status]}</span>
                  <strong>{number.format(totals[status])}</strong>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
export function WeeklyChart({ rows, now }: { rows: Shipment[]; now: number }) {
  const { t, locale } = useLocale()
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = now - (6 - i) * 86_400_000
    return {
      key: dateKey(date),
      label: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'Asia/Riyadh' }).format(
        new Date(date),
      ),
      count: rows.filter((row) => dateKey(row.startedAt) === dateKey(date)).length,
    }
  })
  const max = Math.max(1, ...days.map((day) => day.count))
  const number = new Intl.NumberFormat(locale)
  return (
    <section className="panel chart-panel">
      <div className="chart-heading">
        <h2>{t.weeklyActivity}</h2>
        <span>{t.shipmentsUnit}</span>
      </div>
      <div
        className="weekly-chart"
        role="img"
        aria-label={`${t.weeklyActivity}: ${days.map((day) => `${day.label} ${number.format(day.count)}`).join('، ')}`}
      >
        {days.map((day, i) => (
          <div className="bar-column" key={day.key}>
            <span className="bar-count">{number.format(day.count)}</span>
            <div className="bar-track">
              <span
                className={i === 6 ? 'today-bar' : ''}
                style={{ height: `${Math.max(day.count ? 7 : 0, (day.count / max) * 100)}%` }}
              />
            </div>
            <span>{day.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
