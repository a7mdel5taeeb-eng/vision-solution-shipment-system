export const AUTH_STORAGE_KEY = 'vs.connected.auth.v1'

export type AuthEnvironment = {
  MODE?: string
  VITE_APP_MODE?: string
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
export type LocalAuthConfig = { url: string; publicKey: string }
export type AuthConfiguration =
  { kind: 'demo' } | { kind: 'invalid' } | { kind: 'connected'; config: LocalAuthConfig }

/** Vite exposes only these sanitized public values, never the entire VITE_* environment. */
export function browserAuthEnvironment(env: AuthEnvironment) {
  return {
    VITE_APP_MODE:
      env.VITE_APP_MODE === undefined
        ? ''
        : ['demo', 'connected'].includes(env.VITE_APP_MODE)
          ? env.VITE_APP_MODE
          : 'invalid',
    VITE_SUPABASE_URL: validLocalApi(env.VITE_SUPABASE_URL ?? '') ? env.VITE_SUPABASE_URL! : '',
    VITE_SUPABASE_PUBLISHABLE_KEY: publicClientKey(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '')
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY!
      : '',
  }
}

export function needsConnectedMode(env: AuthEnvironment) {
  return env.MODE === 'connected' || (!!env.VITE_APP_MODE && env.VITE_APP_MODE !== 'demo')
}

function loopback(url: URL) {
  return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
}

export function validLocalApi(value: string) {
  try {
    const url = new URL(value)
    return (
      loopback(url) &&
      url.port === '54321' &&
      url.pathname === '/' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

export function publicClientKey(value: string) {
  if (value.length > 4096) return false
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(value)) return true
  try {
    const parts = value.split('.')
    if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false
    const payload = JSON.parse(atob(parts[1]!.replaceAll('-', '+').replaceAll('_', '/'))) as {
      role?: unknown
    }
    return payload.role === 'anon'
  } catch {
    return false
  }
}

/** Configuration errors never echo URLs, keys or credentials into the interface. */
export function readAuthConfiguration(env: AuthEnvironment, appOrigin: string): AuthConfiguration {
  if (!needsConnectedMode(env)) return { kind: 'demo' }
  if (env.VITE_APP_MODE && env.VITE_APP_MODE !== 'connected') return { kind: 'invalid' }
  try {
    const origin = new URL(appOrigin)
    // Keep the existing demo origin/storage separate. Connected preview uses port 5174.
    if (!loopback(origin) || !origin.port || ['5173', '4173'].includes(origin.port))
      return { kind: 'invalid' }
  } catch {
    return { kind: 'invalid' }
  }
  const url = env.VITE_SUPABASE_URL?.trim() ?? ''
  const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
  if (!validLocalApi(url) || publicKey.length > 4096 || !publicClientKey(publicKey))
    return { kind: 'invalid' }
  return { kind: 'connected', config: { url: new URL(url).origin, publicKey } }
}
