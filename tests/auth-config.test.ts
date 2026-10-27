import test from 'node:test'
import assert from 'node:assert/strict'
import {
  browserAuthEnvironment,
  needsConnectedMode,
  publicClientKey,
  readAuthConfiguration,
  validLocalApi,
  AUTH_STORAGE_KEY,
} from '../src/app/auth/config.ts'
import { clearAuthStorage } from '../src/app/auth/client.ts'

const anon = `${btoa('{}').replaceAll('=', '')}.${btoa(JSON.stringify({ role: 'anon' })).replaceAll('=', '')}.signature`
const env = {
  MODE: 'connected',
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_PUBLISHABLE_KEY: anon,
}

test('default development/production remains demo; connected requires an explicit opt-in', () => {
  for (const MODE of [undefined, 'development', 'production']) {
    assert.equal(needsConnectedMode({ MODE }), false)
    assert.equal(readAuthConfiguration({ MODE }, 'http://127.0.0.1:5173').kind, 'demo')
  }
  assert.equal(needsConnectedMode({ MODE: 'connected' }), true)
  assert.equal(needsConnectedMode({ VITE_APP_MODE: 'connected' }), true)
  assert.equal(
    readAuthConfiguration({ VITE_APP_MODE: 'mistyped' }, 'http://127.0.0.1:5174').kind,
    'invalid',
  )
})
test('connected mode fails closed on missing configuration and on the existing demo origin', () => {
  for (const entry of [
    { MODE: 'connected' },
    { ...env, VITE_SUPABASE_URL: '' },
    { ...env, VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  ]) {
    assert.equal(readAuthConfiguration(entry, 'http://127.0.0.1:5174').kind, 'invalid')
  }
  for (const origin of [
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'https://system.vsolutions.co',
    'http://192.168.1.2:5174',
  ]) {
    assert.equal(readAuthConfiguration(env, origin).kind, 'invalid')
  }
  assert.equal(readAuthConfiguration(env, 'http://127.0.0.1:5174').kind, 'connected')
})
test('only the dedicated loopback HTTP API is accepted; credentials, redirects and cloud URLs are rejected', () => {
  const userInfo = new URL('http://127.0.0.1:54321')
  userInfo.username = 'x'
  userInfo.password = 'x'
  for (const url of [
    'https://example.supabase.co',
    'http://localhost.evil:54321',
    'http://0.0.0.0:54321',
    'http://192.168.1.3:54321',
    'http://127.0.0.1:54322',
    userInfo.href,
    'http://127.0.0.1:54321/path',
    'http://127.0.0.1:54321?next=cloud',
    'http://127.0.0.1:54321#token',
  ])
    assert.equal(validLocalApi(url), false)
  assert.equal(validLocalApi('http://localhost:54321'), true)
})
test('only public keys enter browser defines; privileged or malformed key values are removed', () => {
  const service = `${btoa('{}').replaceAll('=', '')}.${btoa(JSON.stringify({ role: 'service_role' })).replaceAll('=', '')}.signature`
  for (const key of [service, 'sb_secret_' + 'x'.repeat(30), 'malformed', 'x'.repeat(5000)]) {
    assert.equal(publicClientKey(key), false)
    assert.equal(
      browserAuthEnvironment({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key })
        .VITE_SUPABASE_PUBLISHABLE_KEY,
      '',
    )
  }
  const defined = browserAuthEnvironment({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: anon })
  assert.deepEqual(Object.keys(defined).sort(), [
    'VITE_APP_MODE',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_URL',
  ])
  assert.equal(defined.VITE_SUPABASE_PUBLISHABLE_KEY, anon)
})
test('connected sign-out clears only its own namespace, preserving demo records and entry preference', async () => {
  const values = new Map([
    ['vs.demo.v1', 'preserve records'],
    ['vs.demo-entry.v1', 'admin'],
    [AUTH_STORAGE_KEY, 'session'],
    [`${AUTH_STORAGE_KEY}-user`, 'user'],
  ])
  await clearAuthStorage({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  })
  assert.equal(values.get('vs.demo.v1'), 'preserve records')
  assert.equal(values.get('vs.demo-entry.v1'), 'admin')
  assert.equal(values.has(AUTH_STORAGE_KEY), false)
  assert.equal(values.has(`${AUTH_STORAGE_KEY}-user`), false)
})
