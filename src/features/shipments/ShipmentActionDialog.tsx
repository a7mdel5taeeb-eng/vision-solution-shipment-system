import { useRef, useState, type FormEvent } from 'react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { dateTimeInput, formatDate, fromRiyadhInput } from '../../shared/lib/dates'
import { Button } from '../../shared/ui/Primitives'
import { Modal } from '../../shared/ui/Modal'
import { displayField, type Shipment } from './model'

export type ShipmentAction = 'complete' | 'reopen' | 'delete' | 'restore'
export function ShipmentActionDialog({
  row,
  action,
  onClose,
}: {
  row: Shipment
  action: ShipmentAction
  onClose: () => void
}) {
  const { t, locale } = useLocale()
  const { execute, now } = useDemo()
  const [openedAt] = useState(Date.now)
  const [initialCompletion] = useState(() => dateTimeInput(row.completedAt ?? openedAt))
  const completionInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(false)
  const titles = {
    complete: row.workflow === 'completed' ? t.editCompletion : t.markCompleted,
    reopen: t.reopen,
    delete: t.deleteTitle,
    restore: t.restore,
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    if (action === 'complete') {
      const completion = completionInput.current?.value ?? ''
      const time = Date.parse(fromRiyadhInput(completion))
      if (!Number.isFinite(time) || time < Date.parse(row.startedAt) || time > Date.now()) {
        setError(true)
        return
      }
      if (
        execute(
          { type: 'complete', id: row.id, completedAt: fromRiyadhInput(completion) },
          'completionSaved',
        )
      )
        onClose()
    } else if (
      execute(
        { type: action, id: row.id },
        action === 'reopen'
          ? 'shipmentReopened'
          : action === 'delete'
            ? 'shipmentDeleted'
            : 'shipmentRestored',
      )
    )
      onClose()
  }
  return (
    <Modal title={titles[action]} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="modal-record">
          <bdi>{row.id}</bdi> · {displayField(row, 'customer', locale)}
        </p>
        {action === 'complete' ? (
          <>
            <label className="form-field">
              <span>
                {t.completionTime} <em>*</em>
              </span>
              <input
                autoFocus
                type="datetime-local"
                step="1"
                ref={completionInput}
                defaultValue={initialCompletion}
                min={dateTimeInput(row.startedAt)}
                max={dateTimeInput(Math.max(now, openedAt))}
                onInput={() => setError(false)}
                required
                aria-invalid={error}
                aria-describedby="completion-help"
              />
            </label>
            <p id="completion-help" className="field-help">
              {t.completionHelp}
            </p>
            <p className="field-help">
              {t.started}: {formatDate(row.startedAt, locale)}
            </p>
            {error && (
              <p className="form-error" role="alert">
                {t.invalidCompletion}
              </p>
            )}
          </>
        ) : (
          <p className="modal-description">
            {action === 'delete'
              ? t.deleteHelp
              : action === 'reopen'
                ? t.reopenHelp
                : t.deletedDescription}
          </p>
        )}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" className={action === 'delete' ? 'button-danger' : ''}>
            {action === 'complete'
              ? t.confirmCompletion
              : action === 'delete'
                ? t.deleteShipment
                : action === 'reopen'
                  ? t.reopen
                  : t.restore}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
