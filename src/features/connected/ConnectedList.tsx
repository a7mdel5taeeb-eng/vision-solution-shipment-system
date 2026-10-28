import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Package, Clock3, CheckCircle2, TriangleAlert } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { connectedMessages } from '../../shared/i18n/connected-messages'
import { formatDate } from '../../shared/lib/dates'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { commandMessages } from '../../shared/i18n/command-messages'
import { reportMessages } from '../../shared/i18n/report-messages'
import { useCommands } from './command-context'
import { defaultQuery, type ReadQuery } from './read-model'
import type { ShipmentReadRepository } from './repository'
import { useRead } from './use-read'
import { ReadCards, ReadFeedback, ReadPagination, ReadStatus } from './ReadComponents'

export function ConnectedList({
  repository,
  admin,
}: {
  repository: ShipmentReadRepository
  admin: boolean
}) {
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const [params, setParams] = useSearchParams()
  const search = (params.get('q') ?? '').slice(0, 200)
  const status = params.get('status') ?? ''
  const scope = admin && params.get('scope') === 'deleted' ? 'deleted' : 'active'
  const offset = Number(params.get('offset') ?? 0)
  const safeOffset = Number.isInteger(offset) && offset >= 0 && offset <= 1000000 ? offset : 0
  const limit = [6, 10, 25].includes(Number(params.get('limit')))
    ? Number(params.get('limit'))
    : admin
      ? 10
      : 6
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest'
  const validStatus = ['', 'pending', 'overdue', 'completed'].includes(status)
    ? (status as ReadQuery['status'])
    : ''
  const load = useCallback(
    (signal: AbortSignal) =>
      repository.list(
        { ...defaultQuery, search, status: validStatus, scope, offset: safeOffset, limit, sort },
        signal,
      ),
    [repository, search, validStatus, scope, safeOffset, limit, sort],
  )
  const { state } = useCommands()
  const result = useRead(load, state.version)
  function filter(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set(key, value)
        if (key !== 'offset') next.delete('offset')
        return next
      },
      { replace: true },
    )
  }
  const page = result.data
  return (
    <div className={`page-stack shipment-list ${admin ? 'table-layout' : 'card-layout'}`}>
      <div className="page-heading">
        <div>
          <h1>{scope === 'deleted' ? t.deletedRecords : admin ? t.allShipments : t.myShipments}</h1>
          <p className="page-description">{admin ? m.adminScope : m.employeeScope}</p>
        </div>
        <Button variant="secondary" onClick={() => void result.retry()}>
          {reportMessages[locale].refresh}
        </Button>
      </div>
      {!admin && (
        <div className="connected-mobile-create">
          <ButtonLink to="/shipments/new">{t.addShipment}</ButtonLink>
        </div>
      )}
      {page && (
        <section
          className={`metrics-grid operational-metrics ${admin ? '' : 'employee-metrics'}`}
          aria-label={t.dashboard}
        >
          {(
            [
              { key: 'total', icon: Package, tone: 'purple', label: t.totalShipments },
              { key: 'pending', icon: Clock3, tone: 'amber', label: t.pending },
              { key: 'completed', icon: CheckCircle2, tone: 'green', label: t.completed },
              { key: 'overdue', icon: TriangleAlert, tone: 'red', label: t.overdue },
            ] as const
          )
            .filter((c) => admin || c.key !== 'total')
            .map(({ key, icon: Icon, tone, label }) => (
              <button
                type="button"
                className={`metric-card metric-${tone}`}
                key={key}
                onClick={() => filter('status', key === 'total' ? '' : key)}
              >
                <span className="metric-top">
                  <span>{label}</span>
                  <span className={`metric-icon ${tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </span>
                <span className="metric-value">
                  {new Intl.NumberFormat(locale).format(BigInt(page.counts[key]))}
                </span>
              </button>
            ))}
        </section>
      )}
      {admin && scope === 'active' && !search && !validStatus && safeOffset === 0 && (
        <UrgentReads repository={repository} />
      )}
      <div className="register-tools panel">
        <div className="register-tools-main">
          <label className="search-field">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">{t.searchShipments}</span>
            <input
              type="search"
              value={search}
              maxLength={200}
              placeholder={t.searchPlaceholder}
              onChange={(e) => filter('q', e.target.value)}
            />
          </label>
          <div className="status-segments" role="group" aria-label={t.status}>
            {(['', 'pending', 'overdue', 'completed'] as const).map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={validStatus === key}
                onClick={() => filter('status', key)}
              >
                {key ? t[key] : t.allStatuses}
              </button>
            ))}
          </div>
        </div>
        <div className="register-tools-secondary">
          <label>
            {t.sortBy}{' '}
            <select value={sort} onChange={(e) => filter('sort', e.target.value)}>
              <option value="newest">{t.newest}</option>
              <option value="oldest">{t.oldest}</option>
            </select>
          </label>
          <label>
            {t.pageSize}{' '}
            <select value={limit} onChange={(e) => filter('limit', e.target.value)}>
              {[6, 10, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="ghost"
            onClick={() => setParams(scope === 'deleted' ? { scope: 'deleted' } : {})}
          >
            {t.clearFilters}
          </Button>
        </div>
      </div>
      {result.status !== 'ready' ? (
        <ReadFeedback {...result} />
      ) : (
        page && (
          <>
            {!page.rows.length ? (
              <section className="panel list-empty" role="status">
                <h2>
                  {scope === 'deleted'
                    ? commandMessages[locale].deletedEmpty
                    : search || validStatus
                      ? commandMessages[locale].filteredEmpty
                      : commandMessages[locale].emptyTitle}
                </h2>
                <p>
                  {scope === 'deleted'
                    ? commandMessages[locale].deletedHelp
                    : search || validStatus
                      ? commandMessages[locale].filteredHelp
                      : commandMessages[locale].emptyHelp}
                </p>
                {scope === 'active' && !search && !validStatus && (
                  <ButtonLink to="/shipments/new">{t.addShipment}</ButtonLink>
                )}
              </section>
            ) : admin ? (
              <>
                <div className="data-table-scroll admin-table">
                  <table className="data-table">
                    <caption className="sr-only">{t.shipments}</caption>
                    <thead>
                      <tr>
                        {[
                          t.shipmentId,
                          t.customer,
                          t.route,
                          t.truck,
                          t.driver,
                          t.startDate,
                          t.status,
                        ].map((label) => (
                          <th scope="col" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {page.rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <Link className="shipment-id" to={`/shipments/${row.id}`}>
                              <bdi>{row.display_id}</bdi>
                            </Link>
                          </td>
                          <td className="customer-cell" dir="auto">
                            {row.customer}
                          </td>
                          <td className="table-route">
                            <strong dir="auto">{row.origin}</strong>
                            <small dir="auto">{row.destination}</small>
                          </td>
                          <td>
                            <bdi>{row.truck}</bdi>
                          </td>
                          <td dir="auto">{row.driver}</td>
                          <td>{formatDate(row.started_at, locale)}</td>
                          <td>
                            <ReadStatus row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-mobile-cards">
                  <ReadCards rows={page.rows} />
                </div>
              </>
            ) : (
              <ReadCards rows={page.rows} />
            )}
            <ReadPagination
              offset={safeOffset}
              limit={limit}
              total={page.total}
              count={page.rows.length}
              onChange={(v) => filter('offset', String(v))}
            />
            <p className="field-help">
              {m.serverTime}: {formatDate(page.server_now, locale)} · {t.localTime}
            </p>
            <p className="field-help">{reportMessages[locale].sync}</p>
          </>
        )
      )}
    </div>
  )
}
function UrgentReads({ repository }: { repository: ShipmentReadRepository }) {
  const { t, locale } = useLocale()
  const load = useCallback(
    (signal: AbortSignal) =>
      repository.list({ ...defaultQuery, status: 'overdue', sort: 'oldest', limit: 3 }, signal),
    [repository],
  )
  const { state } = useCommands()
  const result = useRead(load, state.version)
  if (result.status !== 'ready') return <ReadFeedback {...result} />
  if (!result.data?.rows.length) return null
  return (
    <section className="panel detail-panel">
      <div className="page-heading">
        <h2>{t.overdue}</h2>
        <Link className="text-link" to="/workspace?status=overdue">
          {reportMessages[locale].allOverdue}
        </Link>
      </div>
      <ReadCards rows={result.data.rows} />
    </section>
  )
}
