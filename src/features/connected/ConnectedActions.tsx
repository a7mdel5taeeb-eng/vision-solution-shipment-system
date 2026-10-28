import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { Modal } from '../../shared/ui/Modal'
import { useLocale } from '../../shared/i18n/locale-context'
import { commandMessages } from '../../shared/i18n/command-messages'
import { dateTimeInput, formatDate } from '../../shared/lib/dates'
import { completionFromInput, type CommandOperation } from './command-model'
import type { ReadShipment } from './read-model'
import { useCommands } from './command-context'
import type { ShipmentReadRepository } from './repository'

type Action = Exclude<CommandOperation, 'create' | 'update'>
export function ConnectedActions({
  row,
  admin,
  repository,
}: {
  row: ReadShipment
  admin: boolean
  repository: ShipmentReadRepository
}) {
  const { t } = useLocale(),
    { state } = useCommands(),
    [action, setAction] = useState<Action | null>(null)
  const blocked = state.status === 'sending' || !!state.intent
  return (
    <>
      <div className="detail-action-bar">
        {row.deleted_at ? (
          admin && (
            <Button disabled={blocked} onClick={() => setAction('restore')}>
              {t.restore}
            </Button>
          )
        ) : (
          <>
            {!blocked && (
              <ButtonLink variant="secondary" to={`/shipments/${row.id}/edit`}>
                {t.editShipment}
              </ButtonLink>
            )}
            <Button disabled={blocked} onClick={() => setAction('complete')}>
              {row.workflow === 'completed' ? t.editCompletion : t.markCompleted}
            </Button>
            {row.workflow === 'completed' && (
              <Button variant="secondary" disabled={blocked} onClick={() => setAction('reopen')}>
                {t.reopen}
              </Button>
            )}
            {admin && (
              <Button
                variant="ghost"
                className="danger-text"
                disabled={blocked}
                onClick={() => setAction('delete')}
              >
                {t.deleteShipment}
              </Button>
            )}
          </>
        )}
      </div>
      {action && (
        <ConnectedActionDialog
          key={`${row.id}:${action}`}
          row={row}
          action={action}
          repository={repository}
          onClose={() => setAction(null)}
        />
      )}
    </>
  )
}
function ConnectedActionDialog({
  row,
  action,
  onClose,
  repository,
}: {
  row: ReadShipment
  action: Action
  onClose: () => void
  repository: ShipmentReadRepository
}) {
  const { t, locale } = useLocale(),
    m = commandMessages[locale],
    { state, session } = useCommands()
  // Hold the opened revision, not a newly polled revision, for the confirmation's whole intent.
  const [snapshot] = useState(row),
    [openedAt] = useState(() => performance.now())
  const [clock, setClock] = useState<{ at: number; received: number } | null>(null)
  const [clockError, setClockError] = useState(false),
    [clockAttempt, setClockAttempt] = useState(0)
  const touched = useRef(false)
  const serverNow = () =>
    (clock?.at ?? Date.parse(snapshot.server_now)) +
    Math.max(0, performance.now() - (clock?.received ?? openedAt))
  const [initialCompletion] = useState(() => dateTimeInput(snapshot.completed_at ?? serverNow()))
  const [error, setError] = useState(false),
    input = useRef<HTMLInputElement>(null),
    alive = useRef(true),
    help = useId()
  useEffect(() => {
    alive.current = true
    if (action === 'complete') input.current?.focus()
    return () => {
      alive.current = false
    }
  }, [action])
  useEffect(() => {
    if (action !== 'complete') return
    const controller = new AbortController()
    void repository
      .detail(snapshot.id, controller.signal)
      .then((current) => {
        if (controller.signal.aborted || !alive.current) return
        const at = Date.parse(current.server_now)
        setClock({ at, received: performance.now() })
        // Refresh only the clock; never silently replace the confirmation's expected revision.
        if (!snapshot.completed_at && !touched.current && input.current)
          input.current.value = dateTimeInput(at)
      })
      .catch(() => {
        if (!controller.signal.aborted && alive.current) setClockError(true)
      })
    return () => controller.abort()
  }, [action, repository, snapshot.id, snapshot.completed_at, clockAttempt])
  const busy = state.status === 'sending' || !!state.intent
  const title =
    action === 'complete'
      ? snapshot.workflow === 'completed'
        ? t.editCompletion
        : t.markCompleted
      : action === 'delete'
        ? t.deleteTitle
        : action === 'restore'
          ? t.restore
          : t.reopen
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || (action === 'complete' && !clock)) return
    const completedAt =
      action === 'complete'
        ? completionFromInput(input.current?.value ?? '', snapshot.started_at, serverNow())
        : null
    if (action === 'complete' && !completedAt) {
      setError(true)
      input.current?.focus()
      return
    }
    const receipt = await session.start(
      action === 'complete'
        ? {
            operation: action,
            id: snapshot.id,
            revision: snapshot.revision,
            completedAt: completedAt!,
          }
        : { operation: action, id: snapshot.id, revision: snapshot.revision },
    )
    if (receipt && alive.current) onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form noValidate onSubmit={(e) => void submit(e)} aria-busy={state.status === 'sending'}>
        <p className="modal-record">
          <bdi>{snapshot.display_id}</bdi> · <bdi>{snapshot.customer}</bdi>
        </p>
        {action === 'complete' ? (
          <>
            <label className="form-field">
              <span>
                {t.completionTime} <em>*</em>
              </span>
              <input
                ref={input}
                autoFocus
                type="datetime-local"
                step="1"
                required
                disabled={busy}
                defaultValue={initialCompletion}
                min={dateTimeInput(snapshot.started_at)}
                onChange={() => {
                  touched.current = true
                  setError(false)
                }}
                onInput={() => {
                  touched.current = true
                  setError(false)
                }}
                aria-invalid={error}
                aria-describedby={help}
              />
            </label>
            <p id={help} className="field-help">
              {m.completionHelp} {t.localTime}
            </p>
            {!clock && !clockError && <p role="status">{m.clockLoading}</p>}
            {clockError && (
              <p role="alert">
                {m.clockError}{' '}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setClockError(false)
                    setClockAttempt((n) => n + 1)
                  }}
                >
                  {m.retryClock}
                </Button>
              </p>
            )}
            <p>
              {t.started}: {formatDate(snapshot.started_at, locale)}
            </p>
            {error && (
              <p role="alert" className="form-error">
                {t.invalidCompletion}
              </p>
            )}
          </>
        ) : (
          <p className="modal-description">
            {action === 'delete'
              ? t.deleteHelp
              : action === 'restore'
                ? m.restoreHelp
                : t.reopenHelp}
          </p>
        )}
        {(state.status === 'error' || state.status === 'uncertain') && (
          <p className="form-error" role="alert">
            {state.status === 'uncertain' ? m.uncertain : m[state.problem ?? 'validation']}
          </p>
        )}
        <div className="modal-actions">
          {state.status === 'uncertain' && (
            <Button
              variant="secondary"
              onClick={() =>
                void (async () => {
                  const result = await session.retry()
                  if (result && alive.current) onClose()
                })()
              }
            >
              {m.retry}
            </Button>
          )}
          {state.problem === 'conflict' && (
            <Button
              variant="secondary"
              onClick={() => {
                session.dismiss()
                onClose()
              }}
            >
              {m.review}
            </Button>
          )}
          <Button autoFocus={action !== 'complete'} variant="secondary" onClick={onClose}>
            {busy ? t.close : t.cancel}
          </Button>
          <Button
            disabled={busy || state.problem === 'conflict' || (action === 'complete' && !clock)}
            type="submit"
            className={action === 'delete' ? 'button-danger' : ''}
          >
            {action === 'complete'
              ? t.confirmCompletion
              : action === 'delete'
                ? t.deleteShipment
                : title}
          </Button>
        </div>
        {busy && <p className="field-help">{m.closing}</p>}
      </form>
    </Modal>
  )
}
