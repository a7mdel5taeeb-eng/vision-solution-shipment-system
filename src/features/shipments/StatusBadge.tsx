import { CheckCircle2, Clock3, TriangleAlert, Trash2 } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { isLateCompletion, statusOf, type Shipment } from './model'

export function StatusBadge({
  shipment,
  now,
  showLate = false,
}: {
  shipment: Shipment
  now: number
  showLate?: boolean
}) {
  const { t } = useLocale()
  const status = shipment.deletedAt ? 'deleted' : statusOf(shipment, now)
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
