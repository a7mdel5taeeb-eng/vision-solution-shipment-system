import { MapPin, Truck, UserRound, Eye, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { connectedMessages } from '../../shared/i18n/connected-messages'
import { formatDate } from '../../shared/lib/dates'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { StatusBadge } from '../shipments/StatusBadge'
import { DriverPhone } from '../shipments/DriverPhone'
import { shipmentPresentation, type ReadShipment } from './read-model'
import type { ReadProblem } from './repository'

export function ReadStatus({ row }: { row: ReadShipment }) {
  return (
    <StatusBadge
      shipment={shipmentPresentation(row)}
      now={Date.parse(row.server_now)}
      resolvedStatus={row.status}
      showLate
    />
  )
}
export function ReadFeedback({
  status,
  problem,
  retry,
}: {
  status: string
  problem: ReadProblem | null
  retry: () => unknown
}) {
  const { locale } = useLocale(),
    m = connectedMessages[locale]
  return (
    <section className="panel list-empty" role={status === 'error' ? 'alert' : 'status'}>
      <p>{status === 'error' ? m[problem ?? 'network'] : m.loading}</p>
      {status === 'error' && (
        <Button variant="secondary" onClick={() => void retry()}>
          {m.retry}
        </Button>
      )}
    </section>
  )
}
export function ReadCards({ rows }: { rows: ReadShipment[] }) {
  const { t, locale } = useLocale()
  return (
    <div className="shipment-card-grid">
      {rows.map((row) => (
        <article
          className={`shipment-load-card load-${row.deleted_at ? 'deleted' : row.status}`}
          key={row.id}
        >
          <div className="load-card-top">
            <Link className="load-id" to={`/shipments/${row.id}`}>
              <bdi>{row.display_id}</bdi>
            </Link>
            <ReadStatus row={row} />
          </div>
          <h3 dir="auto">{row.customer}</h3>
          <p className="load-cargo" dir="auto">
            {row.cargo}
          </p>
          <div className="load-route">
            {(['origin', 'destination'] as const).map((key) => (
              <div key={key}>
                <MapPin size={15} aria-hidden="true" />
                <div>
                  <small>{key === 'origin' ? t.loadingPoint : t.unloadingPoint}</small>
                  <strong dir="auto">{row[key]}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="load-driver">
            <span>
              <Truck size={15} aria-hidden="true" />
              <span>
                <small>{t.truck}</small>
                <bdi>{row.truck}</bdi>
              </span>
            </span>
            <span>
              <UserRound size={15} aria-hidden="true" />
              <span>
                <small>{t.driver}</small>
                <bdi>{row.driver}</bdi>
                {row.driver_phone && <DriverPhone value={row.driver_phone} />}
              </span>
            </span>
          </div>
          <div className="load-timing">
            <time dateTime={row.started_at}>
              <Clock3 size={12} aria-hidden="true" />
              {formatDate(row.started_at, locale)}
            </time>
          </div>
          <div className="load-actions">
            <ButtonLink variant="secondary" to={`/shipments/${row.id}`}>
              <Eye size={14} aria-hidden="true" />
              {t.viewDetails}
            </ButtonLink>
          </div>
        </article>
      ))}
    </div>
  )
}
export function ReadPagination({
  offset,
  limit,
  total,
  count,
  onChange,
}: {
  offset: number
  limit: number
  total: string
  count: number
  onChange: (offset: number) => void
}) {
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const f = (n: string | number) => new Intl.NumberFormat(locale).format(BigInt(n))
  const hasNext = BigInt(offset + count) < BigInt(total)
  return (
    <div className="pagination">
      <span>
        {t.showing} {f(count ? offset + 1 : 0)}–{f(count ? offset + count : 0)} {t.of} {f(total)}
      </span>
      <div>
        <Button
          variant="secondary"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          {t.previous}
        </Button>
        <Button
          variant="secondary"
          disabled={!hasNext || offset + limit > 1000000}
          onClick={() => onChange(offset + limit)}
        >
          {t.next}
        </Button>
      </div>
      {hasNext && offset + limit > 1000000 && <p role="status">{m.limit}</p>}
    </div>
  )
}
