import test, { before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomUUID, sign } from 'node:crypto'
import type { Session, SupportedStorage } from '@supabase/supabase-js'
import { localAuthContext, createFictionalFixture, localSigningKey } from './local-context.ts'
import { AUTH_STORAGE_KEY } from '../../src/app/auth/config.ts'
import { clearAuthStorage, createLocalAuthClient } from '../../src/app/auth/client.ts'
import { AuthSessionStore } from '../../src/app/auth/session-store.ts'

let context: ReturnType<typeof localAuthContext>
let fixture: Awaited<ReturnType<typeof createFictionalFixture>>
const cleanup: Array<() => void> = []
function memoryStorage() {
  const values = new Map<string, string>([
    ['vs.demo.v1', 'unchanged-demo'],
    ['vs.demo-entry.v1', 'demo-admin'],
  ])
  const storage: SupportedStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
  return { storage, values }
}
function connect(saved = memoryStorage(), transport: typeof fetch = fetch) {
  const selected = createLocalAuthClient(
    { url: context.url, publicKey: context.publicKey },
    saved.storage,
    transport,
  )
  const store = new AuthSessionStore(selected.auth, () => clearAuthStorage(saved.storage))
  cleanup.push(store.start())
  return { client: selected, store, saved }
}
async function state(store: AuthSessionStore, expected: 'anonymous' | 'authenticated' | 'error') {
  const until = Date.now() + 12000
  while (Date.now() < until) {
    if (store.getSnapshot().status === expected && !store.getSnapshot().operation) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail(
    `Session boundary did not reach ${expected}; current status: ${store.getSnapshot().status}`,
  )
}
async function login(connection: ReturnType<typeof connect>) {
  await state(connection.store, 'anonymous')
  await connection.store.signIn(fixture.email, fixture.password)
  await state(connection.store, 'authenticated')
}
function savedSession(connection: ReturnType<typeof connect>): Session {
  return JSON.parse(connection.saved.values.get(AUTH_STORAGE_KEY) ?? 'null') as Session
}
function stopAll() {
  for (const stop of cleanup.splice(0)) stop()
}

before(async () => {
  context = localAuthContext()
  const response = await fetch(`${context.url}/auth/v1/settings`, {
    headers: { apikey: context.publicKey },
  })
  const settings = (await response.json()) as {
    external?: { email?: boolean }
    disable_signup?: boolean
  }
  if (!response.ok || settings.external?.email !== true)
    throw new Error(
      'Local email/password provider is disabled. An owner-approved Auth-only configuration fix is required; no containers were changed by the suite.',
    )
  assert.equal(settings.disable_signup, true, 'Public signup must remain disabled')
  fixture = await createFictionalFixture(context, 'integration')
})
afterEach(stopAll)
after(async () => {
  stopAll()
  if (fixture) {
    const { error } = await context.admin.auth.admin.deleteUser(fixture.id)
    if (error) throw new Error('Failed to clean up only this run’s fictional Auth fixture')
  }
})

test('real local password sign-in verifies the user and never trusts forged admin metadata', async () => {
  const connection = connect()
  await login(connection)
  assert.deepEqual(connection.store.getSnapshot().user, { id: fixture.id, email: fixture.email })
  assert.equal('role' in connection.store.getSnapshot().user!, false)
  assert.equal(connection.saved.values.get('vs.demo.v1'), 'unchanged-demo')
  assert.equal(connection.saved.values.get('vs.demo-entry.v1'), 'demo-admin')
})
test('public signup and anonymous sign-in remain disabled', async () => {
  const connection = connect()
  await state(connection.store, 'anonymous')
  const email = `denied-signup-${randomUUID()}@example.invalid`
  const result = await connection.client.auth.signUp({ email, password: randomUUID() })
  if (result.data.user?.email === email)
    await context.admin.auth.admin.deleteUser(result.data.user.id)
  assert.equal(result.error?.code, 'signup_disabled', 'Global public signup must be denied')
  const anonymous = await connection.client.auth.signInAnonymously()
  assert.equal(
    anonymous.error?.code,
    'anonymous_provider_disabled',
    'Anonymous authentication must be denied',
  )
})
test('incorrect credentials are denied by real Auth without creating an authenticated UI state', async () => {
  const connection = connect()
  await state(connection.store, 'anonymous')
  await connection.store.signIn(fixture.email, 'intentionally-wrong-' + Date.now())
  await state(connection.store, 'anonymous')
  assert.equal(connection.store.getSnapshot().problem, 'credentials')
  assert.equal(connection.store.getSnapshot().user, null)
})
test('a fresh client restores persisted sessions only after server verification', async () => {
  const first = connect()
  await login(first)
  const saved = first.saved
  stopAll()
  const second = connect(saved)
  assert.equal(second.store.getSnapshot().status, 'loading')
  assert.equal(second.store.getSnapshot().user, null)
  await state(second.store, 'authenticated')
  assert.equal(second.store.getSnapshot().user?.id, fixture.id)
})
test('refresh rotates a real refresh token and keeps the verified session', async () => {
  const connection = connect()
  await login(connection)
  const prior = savedSession(connection).refresh_token
  await connection.store.refresh()
  await state(connection.store, 'authenticated')
  assert.ok(savedSession(connection).refresh_token !== prior, 'Refresh token should rotate')
})
test('expired persisted session metadata refreshes through real Auth before route access', async () => {
  const first = connect()
  await login(first)
  const session = savedSession(first)
  const saved = first.saved
  stopAll()
  saved.values.set(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...session, expires_at: Math.floor(Date.now() / 1000) - 1 }),
  )
  const restored = connect(saved)
  await state(restored.store, 'authenticated')
  assert.ok(
    savedSession(restored).refresh_token !== session.refresh_token,
    'SDK restoration must refresh expired storage',
  )
})
test('tampered persisted access tokens never authenticate even with a forged user object', async () => {
  const first = connect()
  await login(first)
  const session = savedSession(first)
  const saved = first.saved
  stopAll()
  const parts = session.access_token.split('.')
  parts[2] = (parts[2]!.startsWith('a') ? 'b' : 'a') + parts[2]!.slice(1)
  saved.values.set(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...session,
      access_token: parts.join('.'),
      user: { ...session.user, user_metadata: { role: 'admin' } },
    }),
  )
  const restored = connect(saved)
  await state(restored.store, 'anonymous')
  assert.equal(restored.store.getSnapshot().user, null)
  assert.equal(saved.values.has(AUTH_STORAGE_KEY), false)
})
test('an actually expired signed JWT is rejected despite future forged storage timestamps', async () => {
  const first = connect()
  await login(first)
  const session = savedSession(first)
  const saved = first.saved
  stopAll()
  const [header, encoded] = session.access_token.split('.')
  const jwtHeader = JSON.parse(Buffer.from(header!, 'base64url').toString()) as {
    alg: string
    kid?: string
  }
  assert.ok(
    ['HS256', 'ES256'].includes(jwtHeader.alg),
    'Use only the existing local Auth signing algorithm',
  )
  const payload = JSON.parse(Buffer.from(encoded!, 'base64url').toString()) as Record<
    string,
    unknown
  >
  const key = jwtHeader.alg === 'ES256' ? localSigningKey(jwtHeader.kid ?? '') : null
  function tokenFor(claims: Record<string, unknown>) {
    const data = `${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`
    const signature = key
      ? sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
      : createHmac('sha256', context.jwtSecret).update(data).digest('base64url')
    return `${data}.${signature}`
  }
  // Prove the fixture signer is accepted before changing only expiry/issued-at claims.
  const valid = await first.client.auth.getUser(tokenFor(payload))
  assert.equal(valid.data.user?.id, fixture.id, 'Fixture signature must be accepted by real Auth')
  payload.exp = Math.floor(Date.now() / 1000) - 60
  payload.iat = Math.floor(Date.now() / 1000) - 3660
  const token = tokenFor(payload)
  saved.values.set(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...session,
      access_token: token,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
  const restored = connect(saved)
  await state(restored.store, 'anonymous')
  assert.equal(restored.store.getSnapshot().user, null)
})
test('expired sessions with an invalid refresh token fail closed and clear their own persistence', async () => {
  const first = connect()
  await login(first)
  const session = savedSession(first)
  const saved = first.saved
  stopAll()
  saved.values.set(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...session, expires_at: 1, refresh_token: 'invalid-refresh-fixture' }),
  )
  const restored = connect(saved)
  await state(restored.store, 'anonymous')
  assert.equal(restored.store.getSnapshot().user, null)
  assert.equal(saved.values.has(AUTH_STORAGE_KEY), false)
})
test('logout clears only connected persistence and reload stays unauthenticated', async () => {
  const connection = connect()
  await login(connection)
  const prior = savedSession(connection).refresh_token
  await connection.store.signOut()
  await state(connection.store, 'anonymous')
  assert.equal(connection.saved.values.has(AUTH_STORAGE_KEY), false)
  assert.equal(connection.saved.values.get('vs.demo.v1'), 'unchanged-demo')
  const refresh = await connection.client.auth.refreshSession({ refresh_token: prior })
  assert.ok(!!refresh.error, 'Successful server logout must revoke the refresh token')
  const saved = connection.saved
  stopAll()
  const reloaded = connect(saved)
  await state(reloaded.store, 'anonymous')
})
test('network errors fail closed, retry recovers, and offline logout removes local access', async () => {
  let offline = false
  const transport: typeof fetch = (input, init) =>
    offline ? Promise.reject(new TypeError('Local test transport unavailable')) : fetch(input, init)
  const connection = connect(undefined, transport)
  await login(connection)
  offline = true
  await connection.store.restore()
  await state(connection.store, 'error')
  assert.equal(connection.store.getSnapshot().user, null)
  offline = false
  await connection.store.restore()
  await state(connection.store, 'authenticated')
  offline = true
  await connection.store.signOut()
  await state(connection.store, 'anonymous')
  assert.equal(connection.saved.values.has(AUTH_STORAGE_KEY), false)
  assert.equal(connection.saved.values.get('vs.demo.v1'), 'unchanged-demo')
})
test('a delayed verification cannot restore a session after logout', async () => {
  const first = connect()
  await login(first)
  const saved = first.saved
  stopAll()
  let release: (() => void) | undefined
  let requested: (() => void) | undefined
  const seen = new Promise<void>((resolve) => {
    requested = resolve
  })
  const transport: typeof fetch = async (input, init) => {
    const response = await fetch(input, init)
    if (String(input).endsWith('/auth/v1/user')) {
      requested?.()
      await new Promise<void>((resolve) => {
        release = resolve
      })
    }
    return response
  }
  const connection = connect(saved, transport)
  await Promise.race([
    seen,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Verification request was not observed')), 8000),
    ),
  ])
  await connection.store.signOut()
  release?.()
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(connection.store.getSnapshot().status, 'anonymous')
  assert.equal(connection.store.getSnapshot().user, null)
})
test('a real authenticated identity with admin metadata has no application account or command access', async () => {
  const connection = connect()
  await login(connection)
  const session = savedSession(connection)
  const response = await fetch(`${context.url}/rest/v1/rpc/get_shipments`, {
    method: 'POST',
    headers: {
      apikey: context.publicKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  assert.equal(response.status, 403)
})
