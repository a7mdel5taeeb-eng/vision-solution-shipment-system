import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { LockKeyhole, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../app/auth/auth-context'
import type { AuthProblem } from '../../app/auth/session-store'
import { Brand } from '../../app/layout/Brand'
import { AppearanceControls } from '../../app/layout/AppearanceControls'
import { useLocale } from '../../shared/i18n/locale-context'
import { Button } from '../../shared/ui/Primitives'
import { formatDate } from '../../shared/lib/dates'

export function AuthFrame({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  const demoUrl = new URL('/', window.location.origin)
  demoUrl.port = '5173'
  return (
    <div className="entry-page auth-page">
      <a className="skip-link" href="#auth-main">
        {t.skip}
      </a>
      <header className="entry-header">
        <Brand />
        <AppearanceControls />
      </header>
      <main id="auth-main" className="auth-main" tabIndex={-1}>
        <div className="auth-mode">
          <LockKeyhole size={15} aria-hidden="true" />
          {t.authMode}
        </div>
        <section className="auth-panel">{children}</section>
        <a
          className="button button-secondary"
          href={demoUrl.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.authDemo}
        </a>
        <p className="auth-help">{t.authDemoHelp}</p>
      </main>
      <footer className="entry-footer">
        <span>{t.appName}</span>
        <span>{t.authMode}</span>
      </footer>
    </div>
  )
}

export function AuthConfigurationPage() {
  const { t } = useLocale()
  return (
    <AuthFrame>
      <h1>{t.authConfigTitle}</h1>
      <p>{t.authConfigDescription}</p>
      <p className="auth-help">{t.authConfigHelp}</p>
    </AuthFrame>
  )
}

function Problem({ problem }: { problem: AuthProblem | null }) {
  const { t } = useLocale()
  const messages = {
    credentials: t.authCredentials,
    network: t.authNetwork,
    expired: t.authExpired,
    logout: t.authLogout,
    provider: t.authProvider,
  }
  return problem ? (
    <p id="auth-problem" className="auth-error" role="alert">
      {messages[problem]}
    </p>
  ) : null
}

function Pending() {
  const { t } = useLocale()
  const { state } = useAuth()
  return (
    <AuthFrame>
      <p role="status" aria-live="polite">
        {state.operation === 'signout' ? t.authSigningOut : t.authChecking}
      </p>
    </AuthFrame>
  )
}

function Unavailable() {
  const { t } = useLocale()
  const { store } = useAuth()
  return (
    <AuthFrame>
      <h1>{t.authLoginTitle}</h1>
      <Problem problem="network" />
      <Button onClick={() => void store.restore()}>{t.authRetry}</Button>
      <Button variant="secondary" onClick={() => void store.signOut()}>
        {t.authSignOut}
      </Button>
    </AuthFrame>
  )
}

export function ProtectedAuthRoute() {
  const { state } = useAuth()
  if (state.status === 'loading') return <Pending />
  if (state.status === 'error') return <Unavailable />
  return state.status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

export function AuthLoginPage() {
  const { t } = useLocale()
  const { state, store } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  if (state.status === 'loading') return <Pending />
  if (state.status === 'error') return <Unavailable />
  if (state.status === 'authenticated') return <Navigate to="/workspace" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedPassword = password
    setPassword('')
    await store.signIn(email, submittedPassword)
  }
  return (
    <AuthFrame>
      <h1>{t.authLoginTitle}</h1>
      <p>{t.authLoginDescription}</p>
      <form className="auth-form" onSubmit={submit} aria-busy={!!state.operation}>
        <label className="form-field" htmlFor="auth-email">
          <span>{t.authEmail}</span>
          <input
            id="auth-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!!state.operation}
            aria-describedby={state.problem ? 'auth-problem' : undefined}
          />
        </label>
        <label className="form-field" htmlFor="auth-password">
          <span>{t.authPasswordLabel}</span>
          <input
            id="auth-password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            maxLength={1024}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!!state.operation}
            aria-describedby={state.problem ? 'auth-problem' : undefined}
          />
        </label>
        <Problem problem={state.problem} />
        <Button type="submit" disabled={!!state.operation}>
          {state.operation === 'signin' ? t.authSigningIn : t.authSignIn}
        </Button>
      </form>
    </AuthFrame>
  )
}

export function AuthWorkspacePage() {
  const { t, locale } = useLocale()
  const { state, store } = useAuth()
  return (
    <AuthFrame>
      <ShieldCheck className="auth-confirmed" size={28} aria-hidden="true" />
      <h1>{t.authSessionTitle}</h1>
      <p>{t.authSessionDescription}</p>
      <dl className="auth-details">
        <div>
          <dt>{t.authAccount}</dt>
          <dd>
            <bdi>{state.user?.email}</bdi>
          </dd>
        </div>
        <div>
          <dt>{t.authSessionUntil}</dt>
          <dd>{state.expiresAt ? formatDate(state.expiresAt, locale) : '—'}</dd>
        </div>
      </dl>
      <h2>{t.authScopeTitle}</h2>
      <p>{t.authScopeDescription}</p>
      <div className="auth-actions">
        <Button
          variant="secondary"
          onClick={() => void store.refresh()}
          disabled={!!state.operation}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {t.authRefresh}
        </Button>
        <Button onClick={() => void store.signOut()} disabled={!!state.operation}>
          <LogOut size={16} aria-hidden="true" />
          {t.authSignOut}
        </Button>
      </div>
    </AuthFrame>
  )
}
