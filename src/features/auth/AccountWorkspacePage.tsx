import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../app/auth/auth-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { Button } from '../../shared/ui/Primitives'
import { AuthFrame } from './AuthPages'
import { useAccount } from './use-account'
import { AdminMfa } from './AdminMfa'

export function AccountWorkspacePage() {
  const { state, store } = useAuth()
  const { t, locale } = useLocale()
  const lookup = useAccount()
  const account = lookup.account
  return (
    <AuthFrame>
      {lookup.status === 'loading' ? (
        <p role="status">{t.accountChecking}</p>
      ) : lookup.status === 'error' ? (
        <>
          <h1>{t.accountUnavailable}</h1>
          <p role="alert">{t.accountLookupError}</p>
        </>
      ) : account?.state !== 'active' ? (
        <>
          <h1>{t.accountUnavailable}</h1>
          <p role="alert">
            {account?.state === 'inactive' ? t.accountInactive : t.accountUnauthorized}
          </p>
        </>
      ) : (
        <>
          <ShieldCheck className="auth-confirmed" size={28} aria-hidden="true" />
          <h1>{account.role === 'admin' ? t.accountAdminTitle : t.accountEmployeeTitle}</h1>
          <dl className="auth-details">
            <div>
              <dt>{t.accountName}</dt>
              <dd>{locale === 'ar' ? account.name_ar || account.name : account.name}</dd>
            </div>
            <div>
              <dt>{t.authAccount}</dt>
              <dd>
                <bdi>{state.user!.email}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t.accountRole}</dt>
              <dd>{account.role === 'admin' ? t.accountAdmin : t.accountEmployee}</dd>
            </div>
          </dl>
          {account.role === 'admin' && !account.can_operate ? (
            <AdminMfa />
          ) : (
            <>
              <p role="status">
                {account.role === 'admin' ? t.accountMfaPassed : t.accountEmployeeReady}
              </p>
              <p>{t.accountScope}</p>
            </>
          )}
        </>
      )}
      <div className="auth-actions">
        <Button variant="secondary" onClick={() => void store.refresh()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t.authRefresh}
        </Button>
        <Button onClick={() => void store.signOut()}>
          <LogOut size={16} aria-hidden="true" />
          {t.authSignOut}
        </Button>
      </div>
    </AuthFrame>
  )
}
