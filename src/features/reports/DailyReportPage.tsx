import { CalendarClock, Mail, Settings2 } from 'lucide-react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { formatDate } from '../../shared/lib/dates'
import { ButtonLink, PageHeading } from '../../shared/ui/Primitives'
import { Brand } from '../../app/layout/Brand'
import { displayField, type Shipment } from '../shipments/model'
import { dailyReport, effectiveCompletion } from './report-model'

function EmailSection({
  title,
  rows,
  completed = false,
}: {
  title: string
  rows: Shipment[]
  completed?: boolean
}) {
  const { t, locale } = useLocale()
  return (
    <section className="email-section">
      <h3>
        {title}
        <span>{new Intl.NumberFormat(locale).format(rows.length)}</span>
      </h3>
      {rows.length ? (
        <div className="email-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t.shipmentId}</th>
                <th>{t.customer}</th>
                <th>{t.truck}</th>
                <th>{completed ? t.completionDate : t.startDate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <bdi>{row.id}</bdi>
                  </td>
                  <td>
                    {displayField(row, 'customer', locale)}
                    <small>
                      {displayField(row, 'origin', locale)} /{' '}
                      {displayField(row, 'destination', locale)}
                    </small>
                  </td>
                  <td>
                    <bdi>{row.truck}</bdi>
                    <small>{displayField(row, 'driver', locale)}</small>
                  </td>
                  <td>
                    {formatDate(completed ? effectiveCompletion(row)! : row.startedAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="email-empty">{t.noActivity}</p>
      )}
    </section>
  )
}

export function DailyReportPage() {
  const { t, locale } = useLocale()
  const { state, now } = useDemo()
  const report = dailyReport(state.shipments, now)
  const number = new Intl.NumberFormat(locale)
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow={t.reports}
        title={t.dailyReport}
        description={t.dailyIntro}
        action={
          <ButtonLink to="/settings" variant="secondary">
            <Settings2 size={16} aria-hidden="true" />
            {t.recipients}
          </ButtonLink>
        }
      />
      <div className="preview-notice">
        <Mail size={18} aria-hidden="true" />
        <strong>{t.previewOnly}</strong>
        <span>
          <CalendarClock size={15} aria-hidden="true" />
          {t.scheduledTime}
        </span>
      </div>
      <div className="email-metadata">
        <p>
          <span>{t.recipients}</span>
          {state.recipients.length
            ? state.recipients.map((email) => <bdi key={email}>{email}</bdi>)
            : t.noRecipients}
        </p>
        <p>
          <span>{t.previousDay}</span>
          {formatDate(report.start, locale, false)} · Asia/Riyadh
        </p>
      </div>
      <article className="email-paper">
        <header>
          <Brand />
          <span>{formatDate(report.start, locale, false)}</span>
        </header>
        <div className="email-body">
          <p className="eyebrow">{t.appDescriptor}</p>
          <h2>{t.emailSubject}</h2>
          <p className="email-greeting">{t.emailGreeting}</p>
          <p className="email-intro">{t.emailIntro}</p>
          <div className="email-summary">
            {[
              { title: t.startedYesterday, count: report.started.length },
              { title: t.completedYesterday, count: report.completed.length },
              { title: t.currentlyOverdue, count: report.overdue.length },
            ].map((item) => (
              <div key={item.title}>
                <strong>{number.format(item.count)}</strong>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
          <EmailSection title={t.startedYesterday} rows={report.started} />
          <EmailSection title={t.completedYesterday} rows={report.completed} completed />
          <EmailSection title={t.currentlyOverdue} rows={report.overdue} />
          <div className="email-outstanding">
            <div>
              <h3>{t.outstanding}</h3>
              <p>{t.outstandingDescription}</p>
            </div>
            <strong>{number.format(report.outstanding.length)}</strong>
          </div>
          <ButtonLink to="/dashboard">{t.openAdminDashboard}</ButtonLink>
          <p className="email-disclaimer">
            {t.previewOnly} · {t.localTime}
          </p>
        </div>
        <footer>
          {t.appName}
          <span>{t.footerTagline}</span>
        </footer>
      </article>
    </div>
  )
}
