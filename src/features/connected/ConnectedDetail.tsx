import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { connectedMessages } from '../../shared/i18n/connected-messages'
import { formatDate } from '../../shared/lib/dates'
import { DriverPhone } from '../shipments/DriverPhone'
import { ReadFeedback, ReadPagination, ReadStatus } from './ReadComponents'
import { useRead } from './use-read'
import type { ShipmentReadRepository } from './repository'
import { ConnectedActions } from './ConnectedActions'
import { useCommands } from './command-context'

export function ConnectedDetail({
  id,
  repository,
  admin,
}: {
  id: string
  repository: ShipmentReadRepository
  admin: boolean
}) {
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const load = useCallback((signal: AbortSignal) => repository.detail(id, signal), [repository, id])
  const { state } = useCommands()
  const result = useRead(load, state.version),
    row = result.data
  return (
    <div className="page-stack">
      <Link to="/workspace" className="text-link back-link">
        {t.backToShipments}
      </Link>
      {result.status !== 'ready' ? (
        <ReadFeedback {...result} />
      ) : (
        row && (
          <>
            <div className="page-heading">
              <div>
                <h1>
                  <bdi>{row.display_id}</bdi>
                </h1>
                <p>{t.shipmentDetails}</p>
              </div>
              <ReadStatus row={row} />
            </div>
            <ConnectedActions row={row} admin={admin} repository={repository} />
            <div className="detail-layout">
              <div className="detail-main">
                <section className="panel detail-panel">
                  <h2>{t.shipmentInformation}</h2>
                  <dl className="detail-grid">
                    {[
                      { label: t.customer, value: row.customer },
                      { label: t.origin, value: row.origin },
                      { label: t.destination, value: row.destination },
                      { label: t.truck, value: row.truck },
                      { label: t.driver, value: row.driver },
                      { label: t.cargoDescription, value: row.cargo },
                      { label: t.invoiceNumber, value: row.invoice_number || '—' },
                      { label: t.notes, value: row.notes || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className="preserve-lines" dir="auto">
                          {value}
                        </dd>
                      </div>
                    ))}
                    <div>
                      <dt>{t.driverPhone}</dt>
                      <dd>
                        <DriverPhone value={row.driver_phone ?? ''} />
                      </dd>
                    </div>
                  </dl>
                  <p className="field-help">{m.invoiceHelp}</p>
                </section>
                <ConnectedHistory key={row.id} id={row.id} repository={repository} />
              </div>
              <aside className="panel detail-panel journey-panel">
                <h2>{t.journey}</h2>
                <dl className="detail-grid">
                  {[
                    { label: t.started, value: formatDate(row.started_at, locale) },
                    {
                      label: t.completionDate,
                      value: row.completed_at ? formatDate(row.completed_at, locale) : '—',
                    },
                    { label: m.uuid, value: row.id },
                    { label: m.owner, value: row.owner_id },
                    { label: m.revision, value: row.revision },
                    { label: m.serverTime, value: formatDate(row.server_now, locale) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>
                        <bdi>{value}</bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="field-help">{t.localTime}</p>
                {row.deleted_at && <p>{t.deletedDescription}</p>}
              </aside>
            </div>
          </>
        )
      )}
    </div>
  )
}
function ConnectedHistory({ id, repository }: { id: string; repository: ShipmentReadRepository }) {
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const [offset, setOffset] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => repository.history(id, offset, signal),
    [repository, id, offset],
  )
  const { state } = useCommands()
  const result = useRead(load, state.version),
    page = result.data
  return (
    <section className="panel detail-panel">
      <h2>{t.history}</h2>
      {result.status !== 'ready' ? (
        <ReadFeedback {...result} />
      ) : (
        page && (
          <>
            {!page.rows.length ? (
              <p role="status">{m.emptyHistory}</p>
            ) : (
              <ol className="history-list">
                {page.rows.map((e) => (
                  <li key={e.id}>
                    <span className="history-dot" />
                    <div>
                      <strong>{t[e.action]}</strong>
                      <p>
                        {formatDate(e.occurred_at, locale)} · {m.revision} <bdi>{e.revision}</bdi>
                      </p>
                      <p>
                        {m.actor}: <bdi>{e.actor_id}</bdi>
                      </p>
                      {e.completed_at && (
                        <p>
                          {t.completionDate}: {formatDate(e.completed_at, locale)}
                        </p>
                      )}
                      {e.changed_fields.length > 0 && (
                        <small>
                          {t.changedFields}:{' '}
                          {e.changed_fields
                            .map(
                              (field) =>
                                (
                                  ({
                                    customer: t.customer,
                                    origin: t.origin,
                                    destination: t.destination,
                                    truck: t.truck,
                                    driver: t.driver,
                                    cargo: t.cargoDescription,
                                    driver_phone: t.driverPhone,
                                    invoice_number: t.invoiceNumber,
                                    notes: t.notes,
                                  }) as Record<string, string>
                                )[field] ?? field,
                            )
                            .join('، ')}
                        </small>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <ReadPagination
              offset={offset}
              limit={20}
              total={page.total}
              count={page.rows.length}
              onChange={setOffset}
            />
          </>
        )
      )}
    </section>
  )
}
