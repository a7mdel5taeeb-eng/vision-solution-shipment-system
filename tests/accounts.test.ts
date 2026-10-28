import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAccount } from '../src/app/auth/account.ts'
import { createLocalAuthClient } from '../src/app/auth/client.ts'
import { totp } from './security/totp.ts'

const employee = {
  state: 'active',
  user_id: 'verified-id',
  name: 'Fictional employee',
  name_ar: 'موظف تجريبي',
  role: 'employee',
  aal: 'aal1',
  can_operate: true,
}
test('protected account response must belong to the server-verified identity', () => {
  assert.deepEqual(parseAccount(employee, 'verified-id'), employee)
  assert.throws(() => parseAccount(employee, 'another-id'))
  for (const value of [
    null,
    {},
    { ...employee, role: 'owner' },
    { ...employee, name: 0 },
    { ...employee, name_ar: 42 },
    { ...employee, aal: 'aal3' },
  ])
    assert.throws(() => parseAccount(value, 'verified-id'))
})
test('administrator onboarding is distinct from authorized AAL2; malformed permission combinations fail closed', () => {
  assert.equal(
    parseAccount({ ...employee, role: 'admin', can_operate: false }, 'verified-id').state,
    'active',
  )
  assert.equal(
    parseAccount({ ...employee, role: 'admin', aal: 'aal2' }, 'verified-id').state,
    'active',
  )
  assert.throws(() => parseAccount({ ...employee, role: 'admin' }, 'verified-id'))
  assert.throws(() => parseAccount({ ...employee, can_operate: false }, 'verified-id'))
})
test('inactive and unprovisioned responses discard any attached profile/role data', () => {
  for (const state of ['inactive', 'unprovisioned'])
    assert.deepEqual(parseAccount({ ...employee, state }, 'verified-id'), { state })
})
test('browser transport permits exact read RPCs, never commands, raw tables or GET RPCs', async () => {
  const anon = `${btoa('{}').replaceAll('=', '')}.${btoa(JSON.stringify({ role: 'anon' })).replaceAll('=', '')}.signature`
  const calls: string[] = []
  const selected = createLocalAuthClient(
    { url: 'http://127.0.0.1:54321', publicKey: anon },
    { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    async (input) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ state: 'unprovisioned' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  const me = await selected.rpc('get_my_account')
  assert.equal(me.error, null)
  assert.equal(calls.length, 1)
  for (const request of [
    () => selected.rpc('shipment_command').retry(false),
    () => selected.from('shipments').select('*').retry(false),
    () => selected.rpc('get_my_account', {}, { get: true }).retry(false),
  ]) {
    const result = await request()
    assert.ok(result.error)
  }
  assert.equal(calls.length, 1)
  for (const name of ['read_shipment_page', 'get_shipments', 'read_shipment_history_page'])
    assert.equal((await selected.rpc(name)).error, null)
  assert.equal(calls.length, 4)
  await selected.auth.stopAutoRefresh()
})
test('test-only TOTP generator matches the public RFC 6238 SHA-1 vector', () => {
  assert.equal(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59000), '287082')
})
