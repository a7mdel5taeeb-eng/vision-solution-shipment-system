import { useState } from 'react'
import { Download, Printer, SlidersHorizontal } from 'lucide-react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { dateKey, formatDate, inDateRange } from '../../shared/lib/dates'
import { Button, PageHeading } from '../../shared/ui/Primitives'
import { Brand } from '../../app/layout/Brand'
import { displayField, userName, visibleShipments, statusOf } from '../shipments/model'
import { StatusBadge } from '../shipments/StatusBadge'
import { SummaryCards } from '../shipments/SummaryCards'
import { DistributionChart, WeeklyChart } from './ShipmentCharts'
import { toCsv } from './report-model'

export function ReportsPage() {
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customer, setCustomer] = useState('')
  const [employee, setEmployee] = useState('')
  const active = visibleShipments(state, user)
  const invalid = !!from && !!to && from > to
  const rows = invalid
    ? []
    : active
        .filter(
          (row) =>
            inDateRange(row.startedAt, from, to) &&
            (!customer || row.customer === customer) &&
            (!employee || row.createdBy === employee),
        )
        .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  const customers = [
    ...new Map(
      active.map((row) => [row.customer, displayField(row, 'customer', locale)]),
    ).entries(),
  ]
  function exportCsv() {
    const headers = [
      t.shipmentId,
      t.customer,
      t.origin,
      t.destination,
      t.truck,
      t.driver,
      `${t.startDate} (Asia/Riyadh)`,
      t.status,
      `${t.completionDate} (Asia/Riyadh)`,
      t.createdBy,
    ]
    const data = rows.map((row) => [
      row.id,
      displayField(row, 'customer', locale),
      displayField(row, 'origin', locale),
      displayField(row, 'destination', locale),
      row.truck,
      displayField(row, 'driver', locale),
      formatDate(row.startedAt, locale),
      t[statusOf(row, now)],
      row.completedAt ? formatDate(row.completedAt, locale) : '',
      userName(
        state.users.find((item) => item.id === row.createdBy),
        locale,
      ),
    ])
    const url = URL.createObjectURL(
      new Blob([toCsv([headers, ...data])], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `vision-shipments-${dateKey(now)}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="page-stack report-page">
      <div className="print-brand">
        <Brand subtitle={t.appDescriptor} />
        <span>
          {t.generatedAt}: {formatDate(now, locale)}
        </span>
      </div>
      <PageHeading
        eyebrow={t.workspace}
        title={t.reports}
        description={t.reportsIntro}
        action={
          <div className="heading-buttons">
            <Button variant="secondary" onClick={() => window.print()} disabled={invalid}>
              <Printer size={16} aria-hidden="true" />
              {t.printReport}
            </Button>
            <Button onClick={exportCsv} disabled={invalid || rows.length === 0}>
              <Download size={16} aria-hidden="true" />
              {t.exportCsv}
            </Button>
          </div>
        }
      />
      <section className="panel report-filters">
        <div className="filter-title">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <h2>{t.filters}</h2>
          <Button
            variant="ghost"
            onClick={() => {
              setFrom('')
              setTo('')
              setCustomer('')
              setEmployee('')
            }}
          >
            {t.clearFilters}
          </Button>
        </div>
        <div className="report-filter-grid">
          <label className="form-field">
            <span>{t.fromDate}</span>
            <input
              type="date"
              value={from}
              onInput={(event) => setFrom(event.currentTarget.value)}
            />
          </label>
          <label className="form-field">
            <span>{t.toDate}</span>
            <input type="date" value={to} onInput={(event) => setTo(event.currentTarget.value)} />
          </label>
          <label className="form-field">
            <span>{t.customer}</span>
            <select value={customer} onChange={(event) => setCustomer(event.target.value)}>
              <option value="">{t.allCustomers}</option>
              {customers.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{t.employee}</span>
            <select value={employee} onChange={(event) => setEmployee(event.target.value)}>
              <option value="">{t.allEmployees}</option>
              {state.users.map((item) => (
                <option key={item.id} value={item.id}>
                  {userName(item, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={invalid ? 'form-error' : 'field-help'} role={invalid ? 'alert' : undefined}>
          {invalid ? t.invalidDateRange : t.reportRangeHelp}
        </p>
      </section>
      <p className="print-filter-summary">
        {t.fromDate}: {from || '—'} · {t.toDate}: {to || '—'} · {t.customer}:{' '}
        {customer ? customers.find(([value]) => value === customer)?.[1] : t.allCustomers} ·{' '}
        {t.employee}:{' '}
        {employee
          ? userName(
              state.users.find((item) => item.id === employee),
              locale,
            )
          : t.allEmployees}
      </p>
      <SummaryCards rows={rows} now={now} />
      <div className="dashboard-charts">
        <DistributionChart rows={rows} now={now} />
        <WeeklyChart rows={rows} now={now} />
      </div>
      <section className="panel report-register">
        <div className="panel-heading">
          <div>
            <h2>{t.reportDetail}</h2>
            <p>
              {new Intl.NumberFormat(locale).format(rows.length)} {t.recordCount}
            </p>
          </div>
          <span className="scope-note">{t.localTime}</span>
        </div>
        {rows.length ? (
          <div className="data-table-scroll">
            <table className="data-table report-table">
              <thead>
                <tr>
                  {[
                    t.shipmentId,
                    t.customer,
                    t.route,
                    t.startDate,
                    t.completionDate,
                    t.status,
                    t.createdBy,
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <bdi>{row.id}</bdi>
                    </td>
                    <td>{displayField(row, 'customer', locale)}</td>
                    <td>
                      {displayField(row, 'origin', locale)} /{' '}
                      {displayField(row, 'destination', locale)}
                    </td>
                    <td>{formatDate(row.startedAt, locale)}</td>
                    <td>{row.completedAt ? formatDate(row.completedAt, locale) : '—'}</td>
                    <td>
                      <StatusBadge shipment={row} now={now} showLate />
                    </td>
                    <td>
                      {userName(
                        state.users.find((item) => item.id === row.createdBy),
                        locale,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="list-empty">
            <p>{t.noReportData}</p>
          </div>
        )}
      </section>
    </div>
  )
}
