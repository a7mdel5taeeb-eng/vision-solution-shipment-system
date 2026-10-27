import {
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { formatDate } from '../../shared/lib/dates'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import {
  displayField,
  HOUR,
  OVERDUE_AFTER,
  overdueHours,
  statusOf,
  userName,
  type Shipment,
} from './model'
import { StatusBadge } from './StatusBadge'
import { DriverPhone } from './DriverPhone'
import type { ShipmentAction } from './ShipmentActionDialog'

export function ShipmentCards({
  rows,
  onAction,
}: {
  rows: Shipment[]
  onAction: (row: Shipment, action: ShipmentAction) => void
}) {
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const number = new Intl.NumberFormat(locale)
  return (
    <div className="shipment-card-grid">
      {rows.map((row) => {
        const status = statusOf(row, now)
        const remaining = Math.max(
          0,
          Math.ceil((OVERDUE_AFTER - (now - Date.parse(row.startedAt))) / HOUR),
        )
        return (
          <article
            className={`shipment-load-card load-${row.deletedAt ? 'deleted' : status}`}
            key={row.id}
          >
            <div className="load-card-top">
              <Link className="load-id" to={`/shipments/${row.id}`}>
                <bdi>{row.id}</bdi>
              </Link>
              <StatusBadge shipment={row} now={now} showLate />
            </div>
            <h3>{displayField(row, 'customer', locale)}</h3>
            <p className="load-cargo">{displayField(row, 'cargo', locale)}</p>
            <div className="load-route">
              <div>
                <MapPin size={15} aria-hidden="true" />
                <div>
                  <small>{t.loadingPoint}</small>
                  <strong>{displayField(row, 'origin', locale)}</strong>
                </div>
              </div>
              <div>
                <MapPin size={15} aria-hidden="true" />
                <div>
                  <small>{t.unloadingPoint}</small>
                  <strong>{displayField(row, 'destination', locale)}</strong>
                </div>
              </div>
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
                  {displayField(row, 'driver', locale)}
                  {row.driverPhone && <DriverPhone value={row.driverPhone} />}
                </span>
              </span>
            </div>
            {user.role === 'admin' && (
              <p className="load-owner">
                {t.createdBy}:{' '}
                {userName(
                  state.users.find((item) => item.id === row.createdBy),
                  locale,
                )}
              </p>
            )}
            <div className="load-timing">
              <time dateTime={row.startedAt}>
                <Clock3 size={12} aria-hidden="true" />
                <span className="sr-only">{t.started}: </span>
                {formatDate(row.startedAt, locale)}
              </time>
              {!row.deletedAt && status !== 'completed' && (
                <p className={`load-deadline ${status === 'overdue' ? 'overdue-deadline' : ''}`}>
                  {number.format(status === 'overdue' ? overdueHours(row, now) : remaining)}{' '}
                  {status === 'overdue' ? t.hoursOverdue : t.hoursRemaining}
                </p>
              )}
            </div>
            <div className="load-actions">
              <ButtonLink variant="secondary" to={`/shipments/${row.id}`}>
                <Eye size={14} aria-hidden="true" />
                {t.viewDetails}
              </ButtonLink>
              {row.deletedAt ? (
                <Button variant="secondary" onClick={() => onAction(row, 'restore')}>
                  <RotateCcw size={14} aria-hidden="true" />
                  {t.restore}
                </Button>
              ) : (
                <>
                  <ButtonLink variant="secondary" to={`/shipments/${row.id}/edit`}>
                    <Pencil size={14} aria-hidden="true" />
                    {t.edit}
                  </ButtonLink>
                  <Button
                    className={row.workflow === 'completed' ? 'button-reopen' : 'button-complete'}
                    onClick={() =>
                      onAction(row, row.workflow === 'completed' ? 'reopen' : 'complete')
                    }
                  >
                    {row.workflow === 'completed' ? (
                      <RotateCcw size={14} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={14} aria-hidden="true" />
                    )}
                    {row.workflow === 'completed' ? t.reopen : t.markCompleted}
                  </Button>
                  {user.role === 'admin' && (
                    <Button
                      variant="ghost"
                      className="card-delete"
                      aria-label={`${t.deleteShipment} ${row.id}`}
                      onClick={() => onAction(row, 'delete')}
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
