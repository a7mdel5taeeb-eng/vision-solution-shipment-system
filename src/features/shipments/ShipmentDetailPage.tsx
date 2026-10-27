import { useState } from 'react'
import { ArrowLeft, CalendarClock, Check, Clock3, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { formatDate } from '../../shared/lib/dates'
import { Button, ButtonLink, PageHeading } from '../../shared/ui/Primitives'
import { canAccess, displayField, userName } from './model'
import { fieldLabels } from './field-labels'
import { ShipmentUnavailable } from './ShipmentUnavailable'
import { StatusBadge } from './StatusBadge'
import { DriverPhone } from './DriverPhone'
import { ShipmentActionDialog, type ShipmentAction } from './ShipmentActionDialog'

export function ShipmentDetailPage() {
  const { id } = useParams()
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const [action, setAction] = useState<ShipmentAction | null>(null)
  const row = state.shipments.find((item) => item.id === id)
  if (!row || !canAccess(user, row)) return <ShipmentUnavailable />
  const owner = state.users.find((item) => item.id === row.createdBy)
  return (
    <div className="page-stack">
      <Link to="/shipments" className="text-link back-link">
        <ArrowLeft size={16} className="direction-icon" aria-hidden="true" />
        {t.backToShipments}
      </Link>
      <PageHeading
        eyebrow={t.shipmentDetails}
        title={row.id}
        description={t.detailsDescription}
        action={<StatusBadge shipment={row} now={now} showLate />}
      />
      <div className="detail-action-bar">
        {row.deletedAt ? (
          <Button onClick={() => setAction('restore')}>
            <RotateCcw size={16} aria-hidden="true" />
            {t.restore}
          </Button>
        ) : (
          <>
            <ButtonLink to={`/shipments/${row.id}/edit`} variant="secondary">
              <Pencil size={15} aria-hidden="true" />
              {t.editShipment}
            </ButtonLink>
            <Button onClick={() => setAction('complete')}>
              <Check size={17} aria-hidden="true" />
              {row.workflow === 'completed' ? t.editCompletion : t.markCompleted}
            </Button>
            {row.workflow === 'completed' && (
              <Button variant="secondary" onClick={() => setAction('reopen')}>
                <RotateCcw size={15} aria-hidden="true" />
                {t.reopen}
              </Button>
            )}
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                className="danger-text delete-detail-button"
                onClick={() => setAction('delete')}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t.deleteShipment}
              </Button>
            )}
          </>
        )}
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel detail-panel">
            <h2>{t.shipmentInformation}</h2>
            <dl className="detail-grid">
              {(
                [
                  'customer',
                  'origin',
                  'destination',
                  'truck',
                  'driver',
                  'driverPhone',
                  'cargo',
                ] as const
              ).map((key) => (
                <div key={key}>
                  <dt>{t[fieldLabels[key]]}</dt>
                  <dd>
                    {key === 'driverPhone' ? (
                      <DriverPhone value={row.driverPhone} />
                    ) : (
                      displayField(row, key, locale)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel detail-panel">
            <h2>{t.invoiceSection}</h2>
            <dl className="detail-grid">
              <div>
                <dt>{t.invoiceNumber}</dt>
                <dd>{row.invoice || t.noInvoice}</dd>
              </div>
              <div>
                <dt>{t.notes}</dt>
                <dd className="preserve-lines">{row.notes || t.noNotes}</dd>
              </div>
            </dl>
            {row.invoiceImage && (
              <a
                href={row.invoiceImage}
                download={`${row.id}-invoice`}
                className="invoice-detail-image"
              >
                <img src={row.invoiceImage} alt={t.imagePreview} />
              </a>
            )}
          </section>
          <section className="panel detail-panel">
            <h2>{t.history}</h2>
            <ol className="history-list">
              {[...row.history].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  <span className="history-dot" />
                  <div>
                    <strong>{t[entry.action]}</strong>
                    <p>
                      {userName(
                        state.users.find((item) => item.id === entry.actorId),
                        locale,
                      )}{' '}
                      · {formatDate(entry.at, locale)}
                    </p>
                    {entry.fields && entry.fields.length > 0 && (
                      <small>
                        {t.changedFields}:{' '}
                        {entry.fields.map((field) => t[fieldLabels[field]]).join('، ')}
                      </small>
                    )}
                    {entry.completedAt && (
                      <small>
                        {t.completionDate}: {formatDate(entry.completedAt, locale)}
                      </small>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="panel detail-panel journey-panel">
          <h2>{t.journey}</h2>
          <div className="journey-item">
            <CalendarClock size={20} aria-hidden="true" />
            <div>
              <span>{t.started}</span>
              <strong>{formatDate(row.startedAt, locale)}</strong>
            </div>
          </div>
          <div className="journey-item">
            <Check size={20} aria-hidden="true" />
            <div>
              <span>{t.completionDate}</span>
              <strong>{row.completedAt ? formatDate(row.completedAt, locale) : '—'}</strong>
            </div>
          </div>
          <div className="journey-item">
            <Clock3 size={20} aria-hidden="true" />
            <div>
              <span>{t.shipmentOwner}</span>
              <strong>{userName(owner, locale)}</strong>
            </div>
          </div>
          <p className="field-help">{t.localTime}</p>
          {row.deletedAt && <p className="form-error">{t.deletedDescription}</p>}
        </aside>
      </div>
      {action && <ShipmentActionDialog row={row} action={action} onClose={() => setAction(null)} />}
    </div>
  )
}
