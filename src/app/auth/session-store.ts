import type { Session, SupabaseClient } from '@supabase/supabase-js'

type AuthApi = SupabaseClient['auth']
export type AuthProblem = 'credentials' | 'network' | 'expired' | 'logout' | 'provider'
export type AuthState = {
  status: 'loading' | 'anonymous' | 'authenticated' | 'error'
  user: { id: string; email: string } | null
  expiresAt: number | null
  problem: AuthProblem | null
  operation: 'signin' | 'signout' | 'refresh' | null
}
const initial: AuthState = {
  status: 'loading',
  user: null,
  expiresAt: null,
  problem: null,
  operation: null,
}

function expiry(session: Session): number {
  try {
    const payload = JSON.parse(
      atob(session.access_token.split('.')[1]!.replaceAll('-', '+').replaceAll('_', '/')),
    ) as { exp?: number }
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}
function retryable(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 500
  )
    return true
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      ['AuthRetryableFetchError', 'TimeoutError', 'AbortError'].includes(error.name))
  )
}

/** UI session boundary only. No demo role, user metadata or session object grants privileges. */
export class AuthSessionStore {
  private state: AuthState = initial
  private listeners = new Set<() => void>()
  private active = false
  private blocked = false
  private revision = 0
  private timer: ReturnType<typeof setTimeout> | undefined
  private eventTimer: ReturnType<typeof setTimeout> | undefined
  private unsubscribe: (() => void) | undefined
  private auth: AuthApi
  private clearLocal: () => Promise<unknown>

  constructor(auth: AuthApi, clearLocal: () => Promise<unknown>) {
    this.auth = auth
    this.clearLocal = clearLocal
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private publish(patch: Partial<AuthState>) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }
  private cancelTimers() {
    clearTimeout(this.timer)
    clearTimeout(this.eventTimer)
  }
  start() {
    this.active = true
    this.blocked = false
    const { data } = this.auth.onAuthStateChange((_event, session) => {
      if (!this.active || (this.blocked && session)) return
      if (this.state.operation === 'signout') return
      this.accept(session)
    })
    this.unsubscribe = () => data.subscription.unsubscribe()
    void this.auth.startAutoRefresh()
    void this.restore()
    return () => {
      this.active = false
      this.revision++
      this.cancelTimers()
      this.unsubscribe?.()
      void this.auth.stopAutoRefresh()
    }
  }
  private accept(session: Session | null) {
    const ticket = ++this.revision
    this.cancelTimers()
    if (!session) {
      this.publish({ ...initial, status: 'anonymous' })
      return
    }
    this.publish({ status: 'loading', user: null, expiresAt: null, problem: null })
    // Never await SDK methods inside onAuthStateChange's locked callback.
    this.eventTimer = setTimeout(() => {
      void this.verify(session, ticket)
    }, 0)
  }
  private async invalidate(problem: AuthProblem) {
    this.blocked = true
    this.revision++
    this.cancelTimers()
    void this.auth.stopAutoRefresh()
    try {
      await this.clearLocal()
    } catch {
      /* Fail closed even when browser storage is unavailable. */
    }
    if (this.active) this.publish({ ...initial, status: 'anonymous', problem })
  }
  private async verify(session: Session, ticket: number) {
    try {
      const { data, error } = await this.auth.getUser(session.access_token)
      if (!this.active || this.blocked || ticket !== this.revision) return
      if (error) throw error
      const until = expiry(session)
      if (
        !data.user ||
        data.user.id !== session.user.id ||
        !data.user.email ||
        data.user.is_anonymous ||
        until <= Date.now()
      ) {
        await this.invalidate('expired')
        return
      }
      this.publish({
        status: 'authenticated',
        user: { id: data.user.id, email: data.user.email },
        expiresAt: until,
        problem: null,
        operation: null,
      })
      this.timer = setTimeout(
        () => {
          void this.refresh()
        },
        Math.min(until - Date.now(), 2147483647),
      )
    } catch (error) {
      if (!this.active || this.blocked || ticket !== this.revision) return
      if (retryable(error)) this.publish({ ...initial, status: 'error', problem: 'network' })
      else await this.invalidate('expired')
    }
  }
  restore = async () => {
    this.blocked = false
    const ticket = ++this.revision
    this.publish({ ...initial })
    try {
      const { data, error } = await this.auth.getSession()
      if (!this.active || ticket !== this.revision) return
      if (error) throw error
      this.accept(data.session)
    } catch (error) {
      if (!this.active || ticket !== this.revision) return
      if (retryable(error)) this.publish({ ...initial, status: 'error', problem: 'network' })
      else await this.invalidate('expired')
    }
  }
  signIn = async (email: string, password: string) => {
    if (this.state.operation) return
    this.blocked = false
    this.revision++
    this.cancelTimers()
    this.publish({ ...initial, status: 'anonymous', operation: 'signin' })
    try {
      const { data, error } = await this.auth.signInWithPassword({ email: email.trim(), password })
      if (!this.active || this.blocked) return
      if (error) throw error
      this.accept(data.session)
    } catch (error) {
      if (this.active && !this.blocked)
        this.publish({
          ...initial,
          status: 'anonymous',
          problem:
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'email_provider_disabled'
              ? 'provider'
              : retryable(error)
                ? 'network'
                : 'credentials',
        })
    }
  }
  refresh = async () => {
    if (this.blocked || this.state.operation) return
    this.publish({ status: 'loading', user: null, operation: 'refresh' })
    try {
      const { data, error } = await this.auth.refreshSession()
      if (!this.active || this.blocked) return
      if (error) throw error
      this.accept(data.session)
    } catch (error) {
      if (this.active && !this.blocked) {
        if (retryable(error)) this.publish({ ...initial, status: 'error', problem: 'network' })
        else await this.invalidate('expired')
      }
    }
  }
  signOut = async () => {
    this.blocked = true
    this.revision++
    this.cancelTimers()
    this.publish({ ...initial, operation: 'signout' })
    let failed = false
    try {
      const { error } = await this.auth.signOut({ scope: 'local' })
      failed = !!error
    } catch {
      failed = true
    }
    try {
      await this.clearLocal()
    } catch {
      failed = true
    }
    void this.auth.stopAutoRefresh()
    if (this.active)
      this.publish({ ...initial, status: 'anonymous', problem: failed ? 'logout' : null })
  }
}
