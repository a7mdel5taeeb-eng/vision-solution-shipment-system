import { CheckCircle2, Clock3, TriangleAlert, Trash2 } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { isLateCompletion, statusOf, type Shipment, type ShipmentStatus } from './model'

export function StatusBadge({
  shipment,
  now,
  showLate = false,
  resolvedStatus,
}: {
  shipment: Shipment
  now: number
  showLate?: boolean
  /** Connected reads use the authoritative server result, including sub-millisecond boundaries. */
  resolvedStatus?: ShipmentStatus
}) {
  const { t } = useLocale()
  const status = shipment.deletedAt ? 'deleted' : (resolvedStatus ?? statusOf(shipment, now))
  const Icon =
    status === 'completed'
      ? CheckCircle2
      : status === 'overdue'
        ? TriangleAlert
        : status === 'deleted'
          ? Trash2
          : Clock3
  return (
    <span className="status-stack">
      <span className={`status-badge status-${status}`}>
        <Icon size={13} aria-hidden="true" />
        {t[status]}
      </span>
      {showLate && !shipment.deletedAt && isLateCompletion(shipment) && (
        <small className="late-label">{t.lateCompletion}</small>
      )}
    </span>
  )
}
