import { Mail, Plus, ShieldCheck, ChartNoAxesCombined } from 'lucide-react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { ButtonLink } from '../../shared/ui/Primitives'
import { SummaryCards } from '../shipments/SummaryCards'
import { ShipmentList } from '../shipments/ShipmentList'
import { statusOf, userName, visibleShipments } from '../shipments/model'
import { OverdueSection } from '../alerts/OverdueSection'

export function OverviewPage() {
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const rows = visibleShipments(state, user)
  const admin = user.role === 'admin'
  return (
    <div
      className={`page-stack dashboard-page ${admin ? 'admin-dashboard' : 'employee-dashboard'}`}
    >
      <section
        className={`dashboard-welcome ${admin ? 'admin-welcome' : 'employee-welcome'}`}
        aria-labelledby="dashboard-title"
      >
        <div className="welcome-content">
          <span className="welcome-role">
            {admin && <ShieldCheck size={13} aria-hidden="true" />}
            {admin ? t.adminConsole : t.employeeWorkspace}
          </span>
          <h1 id="dashboard-title">
            {admin ? t.operationsOverview : `${t.welcomeBack} ${userName(user, locale)}`}
          </h1>
          <p>{admin ? t.operationsDescription : t.employeeFocus}</p>
        </div>
        <div className="welcome-actions">
          {admin ? (
            <>
              <ButtonLink to="/daily-report" variant="secondary">
                <Mail size={15} aria-hidden="true" />
                {t.dailyReport}
              </ButtonLink>
              <ButtonLink to="/reports" variant="secondary">
                <ChartNoAxesCombined size={15} aria-hidden="true" />
                {t.reports}
              </ButtonLink>
            </>
          ) : (
            <ButtonLink to="/shipments/new" className="button-registration">
              <Plus size={19} aria-hidden="true" />
              {t.addLoad}
            </ButtonLink>
          )}
        </div>
      </section>
      <SummaryCards rows={rows} now={now} employee={!admin} links />
      {admin && (
        <OverdueSection
          rows={rows.filter((row) => statusOf(row, now) === 'overdue')}
          now={now}
          admin
        />
      )}
      <section
        className={`shipment-register dashboard-register ${!admin ? 'personal-register' : ''}`}
        aria-labelledby="register-title"
      >
        <div className="register-heading">
          <div>
            <h2 id="register-title">
              {admin ? t.allShipments : t.myShipments}
              <span className="register-count">
                {new Intl.NumberFormat(locale).format(rows.length)}
              </span>
            </h2>
            <p>{admin ? t.adminRegisterDescription : t.personalRecords}</p>
          </div>
          {admin && (
            <ButtonLink to="/shipments/new">
              <Plus size={15} aria-hidden="true" />
              {t.addShipment}
            </ButtonLink>
          )}
        </div>
        <ShipmentList rows={rows} cards={!admin} />
      </section>
    </div>
  )
}
