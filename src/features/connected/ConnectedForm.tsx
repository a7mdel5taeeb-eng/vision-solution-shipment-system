import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/auth/auth-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { commandMessages } from '../../shared/i18n/command-messages'
import { Button, PageHeading } from '../../shared/ui/Primitives'
import { EMPTY_FIELDS, type ShipmentFields } from '../shipments/model'
import { fieldLabels } from '../shipments/field-labels'
import {
  firstInvalidField,
  SHIPMENT_FORM_FIELDS,
  validateShipmentForm,
  type FormField,
} from '../shipments/form-validation'
import { shipmentPresentation, type ReadShipment } from './read-model'
import type { ShipmentReadRepository } from './repository'
import { useRead } from './use-read'
import { ReadFeedback } from './ReadComponents'
import { useCommands } from './command-context'
import { fieldsForCommand } from './command-model'
import { readFormDraft, saveFormDraft } from './form-draft'
import { DRAFT_STORAGE_KEY } from './command-session'

export function ConnectedFormPage({
  id,
  repository,
}: {
  id?: string
  repository: ShipmentReadRepository
}) {
  if (!id) return <ConnectedForm repository={repository} />
  return <EditLoader key={id} id={id} repository={repository} />
}
function EditLoader({ id, repository }: { id: string; repository: ShipmentReadRepository }) {
  const read = useCallback((signal: AbortSignal) => repository.detail(id, signal), [repository, id])
  // Editing holds a revision snapshot. Background polling must never erase a draft or rebase it.
  const result = useRead(read, 0, false)
  if (result.status !== 'ready') return <ReadFeedback {...result} />
  if (result.data?.deleted_at)
    return <ReadFeedback status="error" problem="unavailable" retry={result.retry} />
  return <ConnectedForm row={result.data!} repository={repository} />
}
function ConnectedForm({
  row,
  repository,
}: {
  row?: ReadShipment
  repository: ShipmentReadRepository
}) {
  const { t, locale } = useLocale(),
    m = commandMessages[locale],
    { state: auth } = useAuth()
  const userId = auth.user!.id,
    navigate = useNavigate(),
    { state, session } = useCommands()
  const [draft] = useState(() => readFormDraft(window.sessionStorage, userId, row?.id ?? null))
  const [fields, setFields] = useState<ShipmentFields>(
    () =>
      draft?.fields ??
      (Object.fromEntries(
        Object.keys(EMPTY_FIELDS).map((k) => [
          k,
          row ? (shipmentPresentation(row)[k as keyof ShipmentFields] ?? '') : '',
        ]),
      ) as unknown as ShipmentFields),
  )
  const [revision, setRevision] = useState(draft?.revision ?? row?.revision ?? null)
  const [submitted, setSubmitted] = useState(false),
    [storageError, setStorageError] = useState(false)
  const [latest, setLatest] = useState<ReadShipment | null>(null),
    [reviewing, setReviewing] = useState(false),
    [reviewError, setReviewError] = useState(false),
    [rebased, setRebased] = useState(false)
  const [conflictSeen, setConflictSeen] = useState(false)
  const inputs = useRef<Partial<Record<FormField, HTMLInputElement | null>>>({}),
    mounted = useRef(true)
  const formId = useId()
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const errors = validateShipmentForm(fields),
    invalid = firstInvalidField(errors)
  const blocked = state.status === 'sending' || !!state.intent || storageError
  const conflict =
    conflictSeen || state.problem === 'conflict' || (!!row && revision !== row.revision && !rebased)
  const persist = (next: ShipmentFields, rev = revision) => {
    const saved = saveFormDraft(window.sessionStorage, {
      userId,
      id: row?.id ?? null,
      revision: rev,
      fields: next,
    })
    setStorageError(!saved)
    return saved
  }
  function change(key: keyof ShipmentFields, value: string) {
    const next = { ...fields, [key]: value }
    setFields(next)
    persist(next)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (invalid) {
      inputs.current[invalid]?.focus()
      return
    }
    if (blocked || conflict) return
    if (!persist(fields)) return
    const receipt = await session.start(
      row
        ? { operation: 'update', id: row.id, revision: revision!, fields: fieldsForCommand(fields) }
        : { operation: 'create', fields: fieldsForCommand(fields) },
    )
    if (!mounted.current) return
    if (!receipt) {
      if (session.getSnapshot().problem === 'conflict') setConflictSeen(true)
      return
    }
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    navigate(`/shipments/${receipt.shipment_id}`)
  }
  async function review() {
    if (!row) return
    setReviewing(true)
    setReviewError(false)
    try {
      const current = await repository.detail(row.id, new AbortController().signal)
      if (mounted.current) {
        if (current.deleted_at) throw new Error('Unavailable')
        setLatest(current)
      }
    } catch {
      if (mounted.current) setReviewError(true)
    } finally {
      if (mounted.current) setReviewing(false)
    }
  }
  return (
    <div className="page-stack">
      <Link className="text-link back-link" to={row ? `/shipments/${row.id}` : '/workspace'}>
        {t.backToShipments}
      </Link>
      <PageHeading
        title={row ? t.editShipment : t.addShipment}
        description={row ? t.editDescription : t.newShipmentDescription}
      />
      {row && (
        <p>
          <bdi>{row.display_id}</bdi> · {m.revision} <bdi>{revision}</bdi>
        </p>
      )}
      {conflict && (
        <section className="panel detail-panel" role="alert">
          <p>{m.conflict}</p>
          <Button variant="secondary" disabled={reviewing} onClick={() => void review()}>
            {m.review}
          </Button>
          {reviewError && <p>{m.unavailable}</p>}
          {latest && (
            <>
              <p>
                {m.reviewHelp} · {m.revision} <bdi>{latest.revision}</bdi>
              </p>
              <dl className="detail-grid">
                {Object.entries(fieldsForCommand(shipmentPresentation(latest))).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt>
                        {
                          (
                            {
                              customer: t.customerName,
                              origin: t.loadingLocation,
                              destination: t.unloadingLocation,
                              truck: t.truckNumber,
                              driver: t.driverName,
                              cargo: t.cargoDescription,
                              driver_phone: t.driverPhone,
                              invoice_number: t.invoiceNumber,
                              notes: t.notes,
                            } as Record<string, string>
                          )[key]
                        }
                      </dt>
                      <dd dir="auto">{value || '—'}</dd>
                    </div>
                  ),
                )}
              </dl>
              <Button
                onClick={() => {
                  setRevision(latest.revision)
                  persist(fields, latest.revision)
                  setRebased(true)
                  setConflictSeen(false)
                  setLatest(null)
                  session.dismiss()
                }}
              >
                {m.rebase}
              </Button>
            </>
          )}
        </section>
      )}
      {rebased && <p role="status">{m.ready}</p>}
      <form
        className="shipment-form"
        noValidate
        onSubmit={(e) => void submit(e)}
        aria-busy={state.status === 'sending'}
      >
        {submitted && invalid && (
          <p role="alert" className="form-validation-summary">
            {t.formValidationSummary}
          </p>
        )}
        {storageError && (
          <p role="alert" className="form-error">
            {m.storage}
          </p>
        )}
        <fieldset className="connected-fields" disabled={blocked}>
          <legend className="sr-only">{t.shipmentInformation}</legend>
          <section className="panel form-panel">
            <div className="section-title">
              <div>
                <h2>{t.shipmentInformation}</h2>
                <p>{t.required}</p>
              </div>
            </div>
            <div className="form-grid">
              {SHIPMENT_FORM_FIELDS.map((key) => {
                const error = submitted ? errors[key] : undefined,
                  errorId = `${formId}-${key}-error`
                return (
                  <label
                    className={`form-field ${['cargo', 'customer', 'truck'].includes(key) ? 'field-wide' : ''}`}
                    key={key}
                  >
                    <span>
                      {t[fieldLabels[key]]}
                      {key === 'driverPhone' ? (
                        <small className="optional-label"> {t.optional}</small>
                      ) : (
                        <em> *</em>
                      )}
                    </span>
                    <input
                      ref={(element) => {
                        inputs.current[key] = element
                      }}
                      name={key}
                      aria-label={t[fieldLabels[key]]}
                      type={key === 'driverPhone' ? 'tel' : 'text'}
                      dir={key === 'driverPhone' ? 'ltr' : 'auto'}
                      maxLength={key === 'driverPhone' ? 64 : 200}
                      required={key !== 'driverPhone'}
                      value={fields[key] ?? ''}
                      onChange={(e) => change(key, e.target.value)}
                      autoComplete="off"
                      aria-invalid={!!error}
                      aria-describedby={error ? errorId : undefined}
                    />
                    {error ? (
                      <small id={errorId} className="form-error">
                        {t[error]
                          .replace('{field}', t[fieldLabels[key]])
                          .replace('{limit}', new Intl.NumberFormat(locale).format(200))}
                      </small>
                    ) : key === 'driverPhone' ? (
                      <small className="field-help">{t.driverPhoneHelp}</small>
                    ) : null}
                  </label>
                )
              })}
            </div>
          </section>
          <details
            className="panel optional-panel"
            open={!!(fields.invoice || fields.notes) || undefined}
          >
            <summary>
              {t.invoiceSection} · {t.optional}
            </summary>
            <div className="form-grid">
              <label className="form-field">
                <span>{t.invoiceNumber}</span>
                <input
                  name="invoice"
                  maxLength={100}
                  value={fields.invoice}
                  onChange={(e) => change('invoice', e.target.value)}
                />
              </label>
              <label className="form-field field-wide">
                <span>{t.notes}</span>
                <textarea
                  name="notes"
                  maxLength={2000}
                  rows={3}
                  value={fields.notes}
                  onChange={(e) => change('notes', e.target.value)}
                />
              </label>
            </div>
          </details>
        </fieldset>
        <div className="form-footer">
          <p>
            {t.autoStart} {m.fieldsPreserved}
          </p>
          <div>
            <Button
              variant="secondary"
              onClick={() => navigate(row ? `/shipments/${row.id}` : '/workspace')}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={blocked || conflict}>
              {state.status === 'sending' ? m.sending : row ? t.saveChanges : t.saveShipment}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
