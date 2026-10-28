import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../app/auth/auth-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { Button } from '../../shared/ui/Primitives'
import { normalizeMfaCode, prepareTotpSetup, type Enrollment } from './mfa-setup'

type Factor = { id: string; friendly_name?: string; status: string }

export function AdminMfa() {
  const { client, store } = useAuth()
  const { t } = useLocale()
  const [factors, setFactors] = useState<Factor[] | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(false)
  const [unfinished, setUnfinished] = useState(false)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    let current = true
    void client.auth.mfa
      .listFactors()
      .then(({ data, error }) => {
        if (!current) return
        if (error) setProblem(true)
        else setFactors(data.all.filter((factor) => factor.factor_type === 'totp'))
      })
      .catch(() => {
        if (current) setProblem(true)
      })
    return () => {
      current = false
      live.current = false
    }
  }, [client])
  const verified = factors?.filter((f) => f.status === 'verified') ?? []
  const [selected, setSelected] = useState('')
  const factorId = enrollment?.id ?? (selected || verified[0]?.id)
  async function enroll() {
    if (busy || !factors || verified.length) return
    setBusy(true)
    setProblem(false)
    setUnfinished(false)
    try {
      const result = await prepareTotpSetup(client.auth.mfa, () => live.current)
      if (!live.current || result.kind === 'cancelled') return
      if (result.kind === 'enrolled') setEnrollment(result.enrollment)
      else {
        setFactors(result.factors)
        setUnfinished(result.kind === 'unfinished')
      }
    } catch {
      if (live.current) setProblem(true)
    } finally {
      if (live.current) setBusy(false)
    }
  }
  async function verify(event: FormEvent) {
    event.preventDefault()
    if (busy || !factorId || !/^[0-9]{6}$/.test(code)) return
    const submitted = code
    setCode('')
    setBusy(true)
    setProblem(false)
    try {
      const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code: submitted })
      if (error) throw error
      // Successful MFA publishes a new session; refresh also covers a delayed Auth event.
      await store.refresh()
    } catch {
      if (live.current) setProblem(true)
    } finally {
      if (live.current) setBusy(false)
    }
  }
  return (
    <section className="auth-mfa" aria-labelledby="mfa-title">
      <h2 id="mfa-title">{verified.length ? t.accountMfaVerify : t.accountMfaEnroll}</h2>
      <p>{t.accountMfaHelp}</p>
      {!factors && !problem && <p role="status">{t.authChecking}</p>}
      {problem && (
        <p id="mfa-problem" className="auth-error" role="alert">
          {t.accountMfaError}
        </p>
      )}
      {unfinished && <p role="status">{t.accountMfaUnfinished}</p>}
      {factors && !verified.length && !enrollment && !unfinished && (
        <Button onClick={() => void enroll()} disabled={busy}>
          {t.accountMfaStart}
        </Button>
      )}
      {enrollment && (
        <>
          {enrollment.qr.startsWith('data:image/svg+xml;') && (
            <img className="auth-mfa-qr" src={enrollment.qr} alt={t.accountMfaQr} />
          )}
          <label className="form-field" htmlFor="mfa-key">
            <span>{t.accountMfaManual}</span>
            <input id="mfa-key" dir="ltr" readOnly value={enrollment.secret} autoComplete="off" />
          </label>
          <p className="auth-help">{t.accountMfaPrivate}</p>
        </>
      )}
      {factorId && (
        <form className="auth-form" onSubmit={verify} aria-busy={busy}>
          {verified.length > 1 && (
            <label className="form-field" htmlFor="mfa-factor">
              <span>{t.accountMfaFactor}</span>
              <select
                id="mfa-factor"
                value={selected || verified[0]!.id}
                onChange={(e) => setSelected(e.target.value)}
                disabled={busy}
              >
                {verified.map((factor, index) => (
                  <option key={factor.id} value={factor.id}>
                    {factor.friendly_name || `${t.accountMfaFactor} ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="form-field" htmlFor="mfa-code">
            <span>{t.accountMfaCode}</span>
            <input
              id="mfa-code"
              dir="ltr"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              aria-invalid={problem || undefined}
              aria-describedby={problem ? 'mfa-problem' : undefined}
              value={code}
              disabled={busy}
              onChange={(e) => setCode(normalizeMfaCode(e.target.value))}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? t.accountMfaChecking : t.accountMfaConfirm}
          </Button>
        </form>
      )}
      <p className="auth-help">{t.accountRecovery}</p>
    </section>
  )
}
