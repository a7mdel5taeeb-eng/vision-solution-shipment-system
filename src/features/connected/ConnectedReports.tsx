import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { reportMessages } from '../../shared/i18n/report-messages'
import { formatDate, dateKey } from '../../shared/lib/dates'
import { Button } from '../../shared/ui/Primitives'
import { useRead } from './use-read'
import { useCommands } from './command-context'
import { ReadCards, ReadFeedback, ReadPagination } from './ReadComponents'
import {
  EXPORT_LIMIT,
  reportDefaults,
  reportCsv,
  validReportQuery,
  type ReportQuery,
} from './report-model'
import type { ReportRepository } from './report-repository'
import { uuid } from './read-model'

export function ConnectedReports({
  repository,
  admin,
  daily = false,
}: {
  repository: ReportRepository
  admin: boolean
  daily?: boolean
}) {
  const { t, locale } = useLocale(),
    m = reportMessages[locale],
    { state } = useCommands()
  const [q, setQuery] = useState<ReportQuery>({
    ...reportDefaults,
    kind: daily ? 'daily_starts' : 'operations',
  })
  const [draft, setDraft] = useState(q),
    [invalid, setInvalid] = useState(false)
  const load = useCallback((signal: AbortSignal) => repository.page(q, signal), [repository, q])
  const result = useRead(load, state.version),
    page = result.data
  const form = useRef<HTMLFormElement>(null),
    exportController = useRef<AbortController | null>(null),
    generation = useRef(0)
  const key = useMemo(() => JSON.stringify(q) + ':' + locale, [q, locale])
  const [exportState, setExportState] = useState({ key: '', status: '' })
  useEffect(
    () => () => {
      generation.current++
      exportController.current?.abort()
    },
    [key],
  )
  const exportStatus = exportState.key === key ? exportState.status : ''
  function apply(e: FormEvent) {
    e.preventDefault()
    const next = { ...draft, offset: 0 }
    if (!validReportQuery(next)) {
      setInvalid(true)
      form.current
        ?.querySelector<HTMLInputElement>(
          draft.owner && !uuid(draft.owner) ? 'input[name="owner"]' : 'input[name="from"]',
        )
        ?.focus()
      return
    }
    setInvalid(false)
    setQuery(next)
  }
  async function download() {
    if (exportStatus === 'exporting') return
    const controller = new AbortController(),
      ticket = ++generation.current
    exportController.current?.abort()
    exportController.current = controller
    setExportState({ key, status: 'exporting' })
    try {
      const snapshot = await repository.page(
        { ...q, limit: EXPORT_LIMIT, offset: 0 },
        controller.signal,
      )
      if (controller.signal.aborted || ticket !== generation.current) return
      if (BigInt(snapshot.total) > BigInt(EXPORT_LIMIT)) {
        setExportState({ key, status: 'exportLimit' })
        return
      }
      if (BigInt(snapshot.rows.length) !== BigInt(snapshot.total))
        throw new Error('Incomplete export')
      const headers = [
        t.shipmentId,
        'UUID',
        m.number,
        m.revision,
        m.ownerId,
        t.customer,
        t.origin,
        t.destination,
        t.truck,
        t.driver,
        t.driverPhone,
        t.cargoDescription,
        t.invoiceNumber,
        t.notes,
        m.startedIso,
        m.completed + ' (ISO)',
        t.status,
      ]
      const csv = reportCsv(headers, snapshot.rows)
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `vision-${q.kind}-${dateKey(snapshot.server_now)}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportState({ key, status: 'exportDone' })
    } catch {
      if (!controller.signal.aborted && ticket === generation.current)
        setExportState({ key, status: 'exportError' })
    }
  }
  if (daily && !admin) return <ReadFeedback status="error" problem="denied" retry={result.retry} />
  return (
    <div className="page-stack report-page">
      <div className="page-heading">
        <div>
          <h1>{daily ? m.daily : m.reports}</h1>
          <p className="page-description">{daily ? m.dailyHelp : m.reportHelp}</p>
        </div>
        <Button variant="secondary" onClick={() => void result.retry()}>
          {m.refresh}
        </Button>
      </div>
      {!daily && (
        <form className="panel report-filters" ref={form} onSubmit={apply} noValidate>
          <div className="report-filter-grid">
            <label className="form-field">
              <span>{t.searchShipments}</span>
              <input
                name="search"
                maxLength={200}
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span>{t.status}</span>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as ReportQuery['status'] })
                }
              >
                {(['', 'pending', 'completed', 'overdue'] as const).map((k) => (
                  <option key={k} value={k}>
                    {k ? t[k] : t.allStatuses}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>{m.dateField}</span>
              <select
                value={draft.dateField}
                onChange={(e) =>
                  setDraft({ ...draft, dateField: e.target.value as ReportQuery['dateField'] })
                }
              >
                <option value="started">{m.started}</option>
                <option value="completed">{m.completed}</option>
              </select>
            </label>
            <label className="form-field">
              <span>{t.fromDate}</span>
              <input
                name="from"
                type="date"
                min="1900-01-01"
                max="9998-12-31"
                value={draft.from}
                onInput={(e) => setDraft({ ...draft, from: e.currentTarget.value })}
                aria-invalid={invalid}
              />
            </label>
            <label className="form-field">
              <span>{t.toDate}</span>
              <input
                name="to"
                type="date"
                min="1900-01-01"
                max="9998-12-31"
                value={draft.to}
                onInput={(e) => setDraft({ ...draft, to: e.currentTarget.value })}
                aria-invalid={invalid}
              />
            </label>
            {admin && (
              <label className="form-field">
                <span>{m.owner}</span>
                <input
                  name="owner"
                  dir="ltr"
                  value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value.trim() })}
                  aria-describedby="report-owner-help"
                />
                <small id="report-owner-help">{m.ownerHelp}</small>
              </label>
            )}
          </div>
          {invalid && (
            <p role="alert" className="form-error">
              {m.invalid}
            </p>
          )}
          <div className="auth-actions">
            <Button type="submit">{m.apply}</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft({ ...reportDefaults })
                setQuery({ ...reportDefaults })
                setInvalid(false)
              }}
            >
              {t.clearFilters}
            </Button>
          </div>
        </form>
      )}
      {result.status !== 'ready' ? (
        <ReadFeedback {...result} />
      ) : (
        page && (
          <>
            {daily && (
              <section className="panel detail-panel">
                <p>
                  <strong>
                    {m.intended}: {formatDate(page.intended_delivery_at, locale)} · 08:00
                    Asia/Riyadh
                  </strong>
                </p>
                <p>
                  {m.period}: {formatDate(page.period_start, locale)} — {m.through}{' '}
                  {formatDate(page.period_end, locale)}
                </p>
                <div className="auth-actions" role="group" aria-label={m.daily}>
                  {(['daily_starts', 'daily_completions', 'daily_overdue'] as const).map((kind) => (
                    <Button
                      key={kind}
                      variant={q.kind === kind ? 'primary' : 'secondary'}
                      aria-pressed={q.kind === kind}
                      onClick={() => setQuery({ ...reportDefaults, kind })}
                    >
                      {m[kind]} ·{' '}
                      {new Intl.NumberFormat(locale).format(BigInt(page.daily_counts![kind]))}
                    </Button>
                  ))}
                </div>
              </section>
            )}
            {!daily && (
              <section className="panel detail-panel">
                <h2>{m.overview}</h2>
                <dl className="connected-report-counts">
                  {(['total', 'pending', 'overdue', 'completed'] as const).map((k) => (
                    <div key={k}>
                      <dt>{k === 'total' ? t.totalShipments : t[k]}</dt>
                      <dd>{new Intl.NumberFormat(locale).format(BigInt(page.counts[k]))}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <div>
              <Button
                onClick={() => void download()}
                disabled={exportStatus === 'exporting' || page.total === '0'}
              >
                {exportStatus === 'exporting' ? m.exporting : t.exportCsv}
              </Button>
              <p className="field-help">{m.exportHelp}</p>
              {exportStatus && exportStatus !== 'exporting' && (
                <p role={exportStatus === 'exportDone' ? 'status' : 'alert'}>
                  {m[exportStatus as 'exportLimit' | 'exportDone' | 'exportError']}
                </p>
              )}
            </div>
            {page.rows.length ? (
              <>
                <ReadCards rows={page.rows} completionLabel={m.completed} />
                <ReadPagination
                  offset={q.offset}
                  limit={q.limit}
                  total={page.total}
                  count={page.rows.length}
                  onChange={(offset) => setQuery({ ...q, offset })}
                />
              </>
            ) : (
              <section className="panel list-empty" role="status">
                <p>{m.empty}</p>
              </section>
            )}
            <p className="field-help">
              {m.snapshot}: {formatDate(page.server_now, locale)} · {t.localTime}
            </p>
          </>
        )
      )}
      <p className="field-help">{m.sync}</p>
      <Link className="text-link" to="/workspace">
        {t.backToShipments}
      </Link>
    </div>
  )
}
