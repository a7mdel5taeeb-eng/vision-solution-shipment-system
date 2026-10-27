import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeMfaCode,
  prepareTotpSetup,
  type TotpFactor,
} from '../src/features/auth/mfa-setup.ts'

const factor = (status: string, friendly_name = 'Vision & Solution local'): TotpFactor => ({
  id: 'fixture-factor',
  status,
  friendly_name,
  factor_type: 'totp',
})
function fixture(factors: TotpFactor[] = []) {
  const calls: string[] = []
  const api = {
    listFactors: async () => {
      calls.push('list')
      return { data: { all: factors }, error: null }
    },
    enroll: async () => {
      calls.push('enroll')
      return {
        data: {
          id: 'new-fixture',
          totp: { secret: 'fictional'.repeat(3), qr_code: 'data:image/svg+xml;test' },
        },
        error: null,
      }
    },
    unenroll: async () => {
      assert.fail('No factor may be removed by setup')
    },
  }
  return { calls, api }
}
test('fresh verified factors prevent enrollment even when the page originally offered setup', async () => {
  const f = fixture([factor('verified')])
  assert.equal((await prepareTotpSetup(f.api, () => true)).kind, 'existing')
  assert.deepEqual(f.calls, ['list'])
})
test('an unfinished own enrollment is preserved without removal or duplicate creation', async () => {
  const f = fixture([factor('unverified')])
  assert.equal((await prepareTotpSetup(f.api, () => true)).kind, 'unfinished')
  assert.deepEqual(f.calls, ['list'])
})
test('setup creates only its new factor and leaves unrelated unfinished factors untouched', async () => {
  const f = fixture([factor('unverified', 'Another application')])
  assert.equal((await prepareTotpSetup(f.api, () => true)).kind, 'enrolled')
  assert.deepEqual(f.calls, ['list', 'enroll'])
})
test('unmount/logout before or during factor lookup prevents subsequent enrollment', async () => {
  const f = fixture()
  assert.deepEqual(await prepareTotpSetup(f.api, () => false), { kind: 'cancelled' })
  assert.deepEqual(f.calls, [])
  let active = true
  let finish!: (result: Awaited<ReturnType<typeof f.api.listFactors>>) => void
  f.api.listFactors = () =>
    new Promise((resolve) => {
      finish = resolve
    })
  const pending = prepareTotpSetup(f.api, () => active)
  active = false
  finish({ data: { all: [] }, error: null })
  assert.deepEqual(await pending, { kind: 'cancelled' })
  assert.deepEqual(f.calls, [])
})
test('a completed response after unmount discards setup material without removing the factor', async () => {
  const f = fixture()
  let active = true
  const original = f.api.enroll
  f.api.enroll = async () => {
    const result = await original()
    active = false
    return result
  }
  assert.deepEqual(await prepareTotpSetup(f.api, () => active), { kind: 'cancelled' })
  assert.deepEqual(f.calls, ['list', 'enroll'])
})
test('factor lookup failure prevents any enrollment mutation', async () => {
  const f = fixture()
  f.api.listFactors = async () => {
    throw new Error('Fictional network failure')
  }
  await assert.rejects(prepareTotpSetup(f.api, () => true))
  assert.deepEqual(f.calls, [])
})
test('Arabic/Persian MFA digits normalize without losing leading zeroes or accepting invalid code text', () => {
  assert.equal(normalizeMfaCode('٠١٢٣٤٥'), '012345')
  assert.equal(normalizeMfaCode('۰۱۲۳۴۵'), '012345')
  assert.equal(normalizeMfaCode('0١۲3٤۵'), '012345')
  assert.equal(/^[0-9]{6}$/.test(normalizeMfaCode('١٢x٤٥٦')), false)
})
