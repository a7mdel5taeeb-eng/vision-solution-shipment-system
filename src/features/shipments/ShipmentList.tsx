import { useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { formatDate } from '../../shared/lib/dates'
import { Button } from '../../shared/ui/Primitives'
import { displayField, userName, type Shipment } from './model'
import { queryShipments, type ShipmentSort } from './query'
import { StatusBadge } from './StatusBadge'
import { ShipmentCards } from './ShipmentCards'
import { ShipmentActionDialog, type ShipmentAction } from './ShipmentActionDialog'

export function ShipmentList({
  rows,
  initialStatus = '',
  compact = false,
  cards = false,
  personal = false,
}: {
  rows: Shipment[]
  initialStatus?: string
  compact?: boolean
  cards?: boolean
  personal?: boolean
}) {
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [employee, setEmployee] = useState('')
  const [sort, setSort] = useState<ShipmentSort>('newest')
  const [pageSize, setPageSize] = useState(cards ? 6 : compact ? 5 : 10)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<{ row: Shipment; type: ShipmentAction } | null>(null)
  const filtered = queryShipments(
    rows,
    state.users,
    { search, status, employee, sort, locale },
    now,
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const number = new Intl.NumberFormat(locale)
  const clear = () => {
    setSearch('')
    setStatus('')
    setEmployee('')
    setSort('newest')
    setPage(1)
  }
  const onAction = (row: Shipment, type: ShipmentAction) => setAction({ row, type })
  const actions = (row: Shipment) => (
    <div className="row-actions">
      <Link
        className="row-action"
        to={`/shipments/${row.id}`}
        aria-label={`${t.viewDetails} ${row.id}`}
        title={t.viewDetails}
      >
        <Eye size={16} />
      </Link>
      {row.deletedAt ? (
        <button
          type="button"
          className="row-action"
          onClick={() => onAction(row, 'restore')}
          aria-label={`${t.restore} ${row.id}`}
          title={t.restore}
        >
          <RotateCcw size={16} />
        </button>
      ) : (
        <>
          <Link
            className="row-action"
            to={`/shipments/${row.id}/edit`}
            aria-label={`${t.edit} ${row.id}`}
            title={t.edit}
          >
            <Pencil size={15} />
          </Link>
          <button
            type="button"
            className="row-action"
            onClick={() => onAction(row, row.workflow === 'completed' ? 'reopen' : 'complete')}
            aria-label={`${row.workflow === 'completed' ? t.reopen : t.markCompleted} ${row.id}`}
            title={row.workflow === 'completed' ? t.reopen : t.markCompleted}
          >
            {row.workflow === 'completed' ? <RotateCcw size={15} /> : <Check size={16} />}
          </button>
          {user.role === 'admin' && (
            <button
              type="button"
              className="row-action danger-text"
              onClick={() => onAction(row, 'delete')}
              aria-label={`${t.deleteShipment} ${row.id}`}
              title={t.deleteShipment}
            >
              <Trash2 size={15} />
            </button>
          )}
        </>
      )}
    </div>
  )
  return (
    <div className={`shipment-list ${cards ? 'card-layout' : 'table-layout'}`}>
      <div className="register-tools">
        <div className="register-tools-main">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label={t.searchShipments}
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <div className="status-segments" role="group" aria-label={t.status}>
            {(['', 'pending', 'overdue', 'completed'] as const).map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={status === key}
                onClick={() => {
                  setStatus(key)
                  setPage(1)
                }}
              >
                {key ? t[key] : cards ? t.allMyLoads : t.allStatuses}
              </button>
            ))}
          </div>
        </div>
        <div className="register-tools-secondary">
          <span className="filtered-count">
            {t.showing} {number.format(filtered.length)} {t.results}
          </span>
          <div>
            {!compact && user.role === 'admin' && !personal && (
              <select
                aria-label={t.employee}
                value={employee}
                onChange={(event) => {
                  setEmployee(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t.allEmployees}</option>
                {state.users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {userName(item, locale)}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label={t.sortBy}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ShipmentSort)
                setPage(1)
              }}
            >
              {(['newest', 'oldest', 'idAscending', 'customerAscending'] as const).map((key) => (
                <option key={key} value={key}>
                  {t[key]}
                </option>
              ))}
            </select>
            {(search || status || employee) && (
              <Button variant="ghost" onClick={clear}>
                {t.clearFilters}
              </Button>
            )}
          </div>
        </div>
      </div>
      {!displayed.length ? (
        <div className="list-empty">
          <Search size={28} aria-hidden="true" />
          <h3>{t.noResults}</h3>
          <p>{t.noResultsDescription}</p>
          <Button variant="secondary" onClick={clear}>
            {t.clearFilters}
          </Button>
        </div>
      ) : cards ? (
        <ShipmentCards rows={displayed} onAction={onAction} />
      ) : (
        <>
          <div className="data-table-scroll admin-table">
            <table className="data-table">
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
                    ...(user.role === 'admin' ? [t.createdBy] : []),
                    t.actions,
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="shipment-id" to={`/shipments/${row.id}`}>
                        <bdi>{row.id}</bdi>
                      </Link>
                    </td>
                    <td className="customer-cell">{displayField(row, 'customer', locale)}</td>
                    <td className="table-route">
                      <strong>{displayField(row, 'origin', locale)}</strong>
                      <small>{displayField(row, 'destination', locale)}</small>
                    </td>
                    <td>
                      <bdi>{row.truck}</bdi>
                    </td>
                    <td>{displayField(row, 'driver', locale)}</td>
                    <td className="date-cell">
                      {formatDate(row.startedAt, locale, false)}
                      <small>
                        {new Intl.DateTimeFormat(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Riyadh',
                        }).format(new Date(row.startedAt))}
                      </small>
                    </td>
                    <td>
                      <StatusBadge shipment={row} now={now} showLate />
                    </td>
                    {user.role === 'admin' && (
                      <td>
                        {userName(
                          state.users.find((item) => item.id === row.createdBy),
                          locale,
                        )}
                      </td>
                    )}
                    <td>{actions(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-mobile-cards">
            <ShipmentCards rows={displayed} onAction={onAction} />
          </div>
        </>
      )}
      <div className="pagination">
        <span>
          {t.showing} {number.format(filtered.length ? (currentPage - 1) * pageSize + 1 : 0)}–
          {number.format(Math.min(currentPage * pageSize, filtered.length))} {t.of}{' '}
          {number.format(filtered.length)} {t.results}
        </span>
        <div>
          {!compact && (
            <label className="page-size">
              <span className="sr-only">{t.pageSize}</span>
              <select
                aria-label={t.pageSize}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
              >
                {(cards ? [6, 12, 24] : [5, 10, 20]).map((size) => (
                  <option value={size} key={size}>
                    {number.format(size)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            variant="secondary"
            className="pagination-arrow"
            disabled={currentPage <= 1}
            aria-label={t.previous}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} className="direction-icon" />
          </Button>
          <span>
            {t.page} {number.format(currentPage)} {t.of} {number.format(pages)}
          </span>
          <Button
            variant="secondary"
            className="pagination-arrow"
            disabled={currentPage >= pages}
            aria-label={t.next}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} className="direction-icon" />
          </Button>
        </div>
      </div>
      {action && (
        <ShipmentActionDialog
          row={action.row}
          action={action.type}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  )
}
