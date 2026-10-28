import { useLocale } from '../../shared/i18n/locale-context'
import { commandMessages } from '../../shared/i18n/command-messages'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { useCommands } from './command-context'
import { useNavigate } from 'react-router-dom'
import { DRAFT_STORAGE_KEY } from './command-session'

export function CommandFeedback() {
  const navigate = useNavigate()
  const { t, locale } = useLocale(),
    m = commandMessages[locale],
    { state, session } = useCommands()
  if (state.status === 'idle') return null
  const saved = state.status === 'saved',
    uncertain = state.status === 'uncertain',
    refresh = state.status === 'refreshError'
  return (
    <section
      className={`connected-command-feedback ${saved ? 'command-success' : 'command-notice'}`}
      role={saved || state.status === 'sending' ? 'status' : 'alert'}
      aria-live="polite"
    >
      <p>
        {state.status === 'sending'
          ? m.sending
          : saved
            ? `${m.saved} ${state.receipt ? t[state.receipt.action] : ''}`
            : refresh
              ? m.refreshError
              : uncertain
                ? m.uncertain
                : m[state.problem ?? 'validation']}
      </p>
      {uncertain && state.problem !== 'uncertain' && state.problem && <p>{m[state.problem]}</p>}
      <div className="auth-actions">
        {(uncertain || refresh) && (
          <Button
            variant="secondary"
            onClick={() =>
              void (async () => {
                const intent = state.intent
                const receipt = await session.retry()
                if (receipt) {
                  if (intent?.p_operation === 'create' || intent?.p_operation === 'update')
                    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
                  navigate(`/shipments/${receipt.shipment_id}`)
                }
              })()
            }
          >
            {refresh ? m.refresh : m.retry}
          </Button>
        )}
        {state.receipt && (
          <ButtonLink variant="secondary" to={`/shipments/${state.receipt.shipment_id}`}>
            {t.viewDetails}
          </ButtonLink>
        )}
        {!state.intent && state.status !== 'sending' && (
          <Button variant="ghost" onClick={session.dismiss}>
            {m.dismiss}
          </Button>
        )}
      </div>
    </section>
  )
}
