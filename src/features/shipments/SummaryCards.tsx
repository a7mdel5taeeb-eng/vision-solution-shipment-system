import { CheckCheck, Clock3, Package, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { shipmentTotals, type Shipment } from './model'

export function SummaryCards({
  rows,
  now,
  employee = false,
  links = false,
}: {
  rows: Shipment[]
  now: number
  employee?: boolean
  links?: boolean
}) {
  const { t, locale } = useLocale()
  const totals = shipmentTotals(rows, now)
  const number = new Intl.NumberFormat(locale)
  const completion = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(totals.total ? totals.completed / totals.total : 0)
  const cards = [
    {
      key: 'total',
      title: t.totalShipments,
      detail: t.activeShipments,
      icon: Package,
      tone: 'purple',
      filter: '',
    },
    {
      key: 'pending',
      title: t.pending,
      detail: t.withinWindow,
      icon: Clock3,
      tone: 'amber',
      filter: 'pending',
    },
    {
      key: 'completed',
      title: t.completed,
      detail: `${t.completionLabel}: ${completion}`,
      icon: CheckCheck,
      tone: 'green',
      filter: 'completed',
    },
    {
      key: 'overdue',
      title: t.overdue,
      detail: t.attentionRequired,
      icon: TriangleAlert,
      tone: 'red',
      filter: 'overdue',
    },
  ] as const
  return (
    <section
      className={`metrics-grid operational-metrics ${employee ? 'employee-metrics' : ''}`}
      aria-label={t.dashboard}
    >
      {cards
        .filter((card) => !employee || card.key !== 'total')
        .map(({ key, title, detail, icon: Icon, tone, filter }) => {
          const content = (
            <>
              <div className="metric-top">
                <span>{title}</span>
                <span className={`metric-icon ${tone}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
              <div className="metric-value">{number.format(totals[key])}</div>
              <p>{detail}</p>
            </>
          )
          return links ? (
            <Link
              className={`metric-card metric-${tone}`}
              key={key}
              to={`/shipments${filter ? `?status=${filter}` : ''}`}
            >
              {content}
            </Link>
          ) : (
            <article className={`metric-card metric-${tone}`} key={key}>
              {content}
            </article>
          )
        })}
    </section>
  )
}
