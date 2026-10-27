import { useState, type FormEvent } from 'react'
import { Mail, Plus, RotateCcw, X } from 'lucide-react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { Modal } from '../../shared/ui/Modal'

export function PrototypeSettings() {
  const { t } = useLocale()
  const { state, execute, reset } = useDemo()
  const [email, setEmail] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  function addRecipient(event: FormEvent) {
    event.preventDefault()
    if (
      execute({ type: 'recipients', recipients: [...state.recipients, email] }, 'recipientsSaved')
    )
      setEmail('')
  }
  return (
    <>
      <section className="panel settings-panel" id="recipients">
        <div className="settings-heading">
          <Mail size={21} aria-hidden="true" />
          <div>
            <h2>{t.recipients}</h2>
            <p>{t.recipientsHelp}</p>
          </div>
        </div>
        <form className="recipient-form" onSubmit={addRecipient} noValidate>
          <label className="form-field">
            <span className="sr-only">{t.recipientEmail}</span>
            <input
              type="email"
              value={email}
              dir="ltr"
              placeholder="operations@vision-demo.example"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <Button type="submit">
            <Plus size={16} aria-hidden="true" />
            {t.addRecipient}
          </Button>
        </form>
        <div className="recipient-chips">
          {state.recipients.map((recipient) => (
            <span key={recipient}>
              <bdi>{recipient}</bdi>
              <button
                aria-label={`${t.removeRecipient} ${recipient}`}
                onClick={() =>
                  execute(
                    {
                      type: 'recipients',
                      recipients: state.recipients.filter((item) => item !== recipient),
                    },
                    'recipientsSaved',
                  )
                }
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {!state.recipients.length && <p className="scope-note">{t.noRecipients}</p>}
        </div>
        <div className="settings-email-footer">
          <span>
            <ClockText />
            {t.scheduledTime}
          </span>
          <ButtonLink variant="ghost" to="/daily-report">
            {t.dailyReport}
          </ButtonLink>
        </div>
      </section>
      <section className="panel settings-panel reset-panel">
        <div className="settings-heading">
          <RotateCcw size={21} aria-hidden="true" />
          <div>
            <h2>{t.demoData}</h2>
            <p>{t.resetDescription}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setConfirmReset(true)}>
          {t.resetDemo}
        </Button>
      </section>
      {confirmReset && (
        <Modal title={t.resetTitle} onClose={() => setConfirmReset(false)}>
          <p className="modal-description">{t.resetHelp}</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              {t.cancel}
            </Button>
            <Button
              className="button-danger"
              onClick={() => {
                if (reset()) setConfirmReset(false)
              }}
            >
              {t.confirmReset}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
function ClockText() {
  return <span className="status-dot" aria-hidden="true" />
}
