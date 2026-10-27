import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { PageHeading } from '../../shared/ui/Primitives'
import { statusOf, visibleShipments } from '../shipments/model'
import { OverdueSection } from './OverdueSection'

export function AlertsPage() {
  const { t } = useLocale()
  const { state, user, now } = useDemo()
  const rows = visibleShipments(state, user).filter((row) => statusOf(row, now) === 'overdue')
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow={t.workspace}
        title={t.overdueAlerts}
        description={t.overdueDescription}
      />
      <OverdueSection rows={rows} now={now} full admin />
      <p className="scope-note">{t.localTime}</p>
    </div>
  )
}
