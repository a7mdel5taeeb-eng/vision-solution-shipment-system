import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, FileImage, Info, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { Button, PageHeading } from '../../shared/ui/Primitives'
import {
  canAccess,
  displayField,
  EMPTY_FIELDS,
  type Shipment,
  type ShipmentField,
  type ShipmentFields,
} from './model'
import { fieldLabels } from './field-labels'
import { ShipmentUnavailable } from './ShipmentUnavailable'
import { validDriverPhone } from '../../shared/lib/phone'

export function ShipmentFormPage() {
  const { id } = useParams()
  const { state, user } = useDemo()
  const row = id ? state.shipments.find((item) => item.id === id) : undefined
  if (id && (!row || !canAccess(user, row) || row.deletedAt)) return <ShipmentUnavailable />
  return <ShipmentForm key={id ?? 'new'} row={row} />
}

function ShipmentForm({ row }: { row?: Shipment }) {
  const { t, locale } = useLocale()
  const { state, execute, notify } = useDemo()
  const navigate = useNavigate()
  const [fields, setFields] = useState<ShipmentFields>(() =>
    row
      ? (Object.fromEntries(
          (Object.keys(EMPTY_FIELDS) as ShipmentField[]).map((key) => [
            key,
            displayField(row, key, locale),
          ]),
        ) as unknown as ShipmentFields)
      : { ...EMPTY_FIELDS },
  )
  const [readingImage, setReadingImage] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const phoneInvalid = !validDriverPhone(fields.driverPhone ?? '')
  const upload = useRef<HTMLInputElement>(null)
  const phoneInput = useRef<HTMLInputElement>(null)
  function setField(key: ShipmentField, value: string) {
    setFields((current) => ({ ...current, [key]: value }))
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    setPhoneTouched(true)
    if (phoneInvalid) {
      phoneInput.current?.focus()
      return
    }
    const savedId = row?.id ?? `TR-${String(state.nextShipmentNumber).padStart(4, '0')}`
    if (
      execute(
        row ? { type: 'update', id: row.id, fields } : { type: 'create', fields },
        row ? 'shipmentUpdated' : 'shipmentCreated',
      )
    )
      navigate(`/shipments/${savedId}`)
  }
  function readImage(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 750 * 1024) {
      notify('invalidImage', true)
      if (upload.current) upload.current.value = ''
      return
    }
    setReadingImage(true)
    const reader = new FileReader()
    reader.onload = () => {
      setField('invoiceImage', String(reader.result))
      setReadingImage(false)
    }
    reader.onerror = () => {
      notify('invalidImage', true)
      setReadingImage(false)
    }
    reader.readAsDataURL(file)
  }
  return (
    <div className="page-stack">
      <Link to={row ? `/shipments/${row.id}` : '/shipments'} className="text-link back-link">
        <ArrowLeft size={16} className="direction-icon" aria-hidden="true" />
        {t.backToShipments}
      </Link>
      <PageHeading
        eyebrow={row?.id ?? t.shipments}
        title={row ? t.editShipment : t.addShipment}
        description={row ? t.editDescription : t.newShipmentDescription}
      />
      <form onSubmit={submit} className="shipment-form" noValidate>
        <section className="panel form-panel">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>{t.shipmentInformation}</h2>
              <p>{t.required}</p>
            </div>
            <Check className="section-decoration" size={22} aria-hidden="true" />
          </div>
          <div className="form-grid">
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
              <label
                className={`form-field ${key === 'cargo' || key === 'customer' || key === 'truck' ? 'field-wide' : ''}`}
                key={key}
              >
                <span>
                  {t[fieldLabels[key]]}{' '}
                  {key === 'driverPhone' ? (
                    <small className="optional-label">{t.optional}</small>
                  ) : (
                    <em>*</em>
                  )}
                </span>
                <input
                  ref={key === 'driverPhone' ? phoneInput : undefined}
                  name={key}
                  aria-label={key === 'driverPhone' ? t.driverPhone : undefined}
                  type={key === 'driverPhone' ? 'tel' : 'text'}
                  inputMode={key === 'driverPhone' ? 'tel' : undefined}
                  dir={key === 'driverPhone' ? 'ltr' : undefined}
                  required={key !== 'driverPhone'}
                  maxLength={key === 'driverPhone' ? 64 : 200}
                  value={fields[key] ?? ''}
                  onBlur={key === 'driverPhone' ? () => setPhoneTouched(true) : undefined}
                  aria-invalid={
                    key === 'driverPhone' && phoneTouched && phoneInvalid ? true : undefined
                  }
                  aria-describedby={
                    key === 'driverPhone'
                      ? phoneTouched && phoneInvalid
                        ? 'driver-phone-error'
                        : 'driver-phone-help'
                      : undefined
                  }
                  autoComplete="off"
                  onChange={(event) => setField(key, event.target.value)}
                />
                {key === 'driverPhone' &&
                  (phoneTouched && phoneInvalid ? (
                    <small id="driver-phone-error" className="form-error" role="alert">
                      {t.invalidDriverPhone}
                    </small>
                  ) : (
                    <small id="driver-phone-help" className="field-help">
                      {t.driverPhoneHelp}
                    </small>
                  ))}
              </label>
            ))}
          </div>
        </section>
        <details
          className="panel optional-panel"
          open={row && !!(row.invoice || row.notes || row.invoiceImage) ? true : undefined}
        >
          <summary>
            <span className="section-number">02</span>
            <span>{t.invoiceSection}</span>
            <span className="optional-label">{t.optional}</span>
          </summary>
          <div className="form-grid">
            <label className="form-field">
              <span>{t.invoiceNumber}</span>
              <input
                name="invoice"
                maxLength={100}
                value={fields.invoice}
                onChange={(event) => setField('invoice', event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>{t.invoiceImage}</span>
              <input
                ref={upload}
                name="invoiceImage"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => readImage(event.target.files?.[0])}
              />
              <small className="field-help">{t.invoiceHelp}</small>
            </label>
            {fields.invoiceImage && (
              <div className="invoice-upload-preview field-wide">
                <FileImage size={20} aria-hidden="true" />
                <img src={fields.invoiceImage} alt={t.imagePreview} />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setField('invoiceImage', '')
                    if (upload.current) upload.current.value = ''
                  }}
                >
                  {t.removeImage}
                </Button>
              </div>
            )}
            <label className="form-field field-wide">
              <span>{t.notes}</span>
              <textarea
                name="notes"
                rows={3}
                maxLength={2000}
                value={fields.notes}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </label>
          </div>
        </details>
        <div className="form-footer">
          <p>
            <Info size={16} aria-hidden="true" />
            {t.autoStart}
          </p>
          <div>
            <Button
              variant="secondary"
              onClick={() => navigate(row ? `/shipments/${row.id}` : '/shipments')}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={readingImage}>
              <Save size={16} aria-hidden="true" />
              {row ? t.saveChanges : t.saveShipment}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
