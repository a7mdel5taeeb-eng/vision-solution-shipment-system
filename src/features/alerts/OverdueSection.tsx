import { ArrowRight, CheckCircle2, Clock3, TriangleAlert, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { formatDate } from '../../shared/lib/dates'
import { displayField, overdueHours, type Shipment } from '../shipments/model'

export function OverdueSection({
  rows,
  now,
  full = false,
  admin = false,
}: {
  rows: Shipment[]
  now: number
  full?: boolean
  admin?: boolean
}) {
  const { t, locale } = useLocale()
  const sorted = [...rows].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))
  const number = new Intl.NumberFormat(locale)
  if (!rows.length)
    return (
      <div className="all-clear">
        <CheckCircle2 size={20} aria-hidden="true" />
        <div>
          <strong>{t.noOverdue}</strong>
          <p>{t.noOverdueDescription}</p>
        </div>
      </div>
    )
  return (
    <section
      className={`overdue-section ${full ? 'overdue-full' : ''}`}
      aria-labelledby="overdue-title"
    >
      <div className="overdue-heading">
        <span className="alert-heading-icon">
          <TriangleAlert size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="overdue-title">
            {full ? t.needsAttention : t.priorityQueue}
            <span className="alert-count">{number.format(rows.length)}</span>
          </h2>
          <p>{full ? t.overdueDescription : t.priorityDescription}</p>
        </div>
        {!full && (
          <Link className="alert-link" to={admin ? '/alerts' : '/shipments?status=overdue'}>
            {t.viewAllAlerts}
            <ArrowRight size={15} className="direction-icon" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="overdue-grid">
        {(full ? sorted : sorted.slice(0, 3)).map((row, index) => (
          <Link key={row.id} to={`/shipments/${row.id}`} className="overdue-card">
            <div className="overdue-card-top">
              <bdi>
                <span className="priority-rank">
                  {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}
                </span>
                {row.id}
              </bdi>
              <span>
                <Clock3 size={12} aria-hidden="true" />
                {number.format(overdueHours(row, now))} {t.hoursOverdue}
              </span>
            </div>
            <h3>{displayField(row, 'customer', locale)}</h3>
            <div className="overdue-card-route">
              {displayField(row, 'origin', locale)}
              <ArrowRight size={12} className="direction-icon" aria-hidden="true" />
              {displayField(row, 'destination', locale)}
            </div>
            <p>
              <Truck size={14} aria-hidden="true" />
              <bdi>{row.truck}</bdi>
              <span>·</span>
              {displayField(row, 'driver', locale)}
            </p>
            <small>
              {t.started}: {formatDate(row.startedAt, locale)}
            </small>
          </Link>
        ))}
      </div>
    </section>
  )
}
