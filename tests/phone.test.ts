import test from 'node:test'
import assert from 'node:assert/strict'
import { validDriverPhone, phoneHref } from '../src/shared/lib/phone.ts'
import {
  applyCommand,
  EMPTY_FIELDS,
  DomainError,
  type ShipmentFields,
} from '../src/features/shipments/model.ts'
import { createSeed } from '../src/app/demo/seed.ts'
import { isDemoState, loadDemo, persistDemo, DEMO_STORAGE_KEY } from '../src/app/demo/repository.ts'

const NOW = Date.parse('2026-10-27T06:00:00Z')
const fields: ShipmentFields = {
  ...EMPTY_FIELDS,
  customer: 'Phone QA',
  origin: 'Riyadh',
  destination: 'Dammam',
  truck: 'QA',
  driver: 'Demo driver',
  cargo: 'Demo load',
}

test('optional phone accepts Saudi, international, Arabic/Persian digits and common extensions', () => {
  for (const value of [
    '',
    ' ',
    '+966500000000',
    '050 000 0000',
    '00966 (50) 000-0000',
    '+1 (202) 555-0145',
    '+44 20 7946 0000 ext. 123',
    '٠٥٠٠٠٠٠٠٠٠',
    '+۹۶۶ ۵۰ ۰۰۰ ۰۰۰۰',
    '+1 202-555-0145;ext=12',
    '555.0145 x10',
  ])
    assert.equal(validDriverPhone(value), true, value)
})

test('phone rejects non-string, short/oversized, malformed prefix and unsafe URI/text values', () => {
  for (const value of [
    null,
    966500000000,
    '12345',
    '+1234567890123456',
    '++966500000000',
    '123+4567890',
    'call me',
    'javascript:alert(1)',
    'tel:+12025550145',
    '+12025550145 ext',
    '+12025550145 x12345678901',
    ' '.repeat(65),
  ])
    assert.equal(validDriverPhone(value), false, String(value))
})

test('tel links normalize formatting, international 00 prefixes, digits and extensions safely', () => {
  assert.equal(phoneHref('+1 (202) 555-0145'), 'tel:+12025550145')
  assert.equal(phoneHref('00966 (50) 000-0000'), 'tel:+966500000000')
  assert.equal(phoneHref('+44 (0)20 7946 0000'), 'tel:+442079460000')
  assert.equal(phoneHref('٠٥٠ ٠٠٠ ٠٠٠٠'), 'tel:0500000000')
  assert.equal(phoneHref('+1 202-555-0145 ext. 12'), 'tel:+12025550145;ext=12')
  assert.equal(phoneHref(''), undefined)
  assert.equal(phoneHref('javascript:alert(1)'), undefined)
})

test('create stores a supplied phone as a string, allows omission, and rejects invalid supplied numbers', () => {
  const state = createSeed(NOW)
  const supplied = applyCommand(
    state,
    'employee-1',
    { type: 'create', fields: { ...fields, driverPhone: ' +966 50 000 0000 ' } },
    NOW,
  )
  assert.equal(
    supplied.shipments.find((row) => row.id === 'TR-0033')?.driverPhone,
    '+966 50 000 0000',
  )
  const without = { ...fields }
  delete without.driverPhone
  assert.equal(
    applyCommand(state, 'employee-1', { type: 'create', fields: without }, NOW).shipments.find(
      (row) => row.id === 'TR-0033',
    )?.driverPhone,
    '',
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        'employee-1',
        { type: 'create', fields: { ...fields, driverPhone: 'bad phone' } },
        NOW,
      ),
    (error) => error instanceof DomainError && error.code === 'invalidDriverPhone',
  )
  assert.equal(state.nextShipmentNumber, 33)
})

test('phone updates obey ownership/admin rules, retain start/owner and append accurate field history', () => {
  let state = createSeed(NOW)
  const row = state.shipments.find((item) => item.createdBy === 'employee-1')!
  const updated = {
    ...row,
    driverPhone: '+1 202-555-0145',
    id: 'TR-9999',
    createdBy: 'employee-2',
    startedAt: new Date(NOW).toISOString(),
  }
  assert.throws(() =>
    applyCommand(state, 'employee-2', { type: 'update', id: row.id, fields: updated }, NOW),
  )
  state = applyCommand(state, 'employee-1', { type: 'update', id: row.id, fields: updated }, NOW)
  const saved = state.shipments.find((item) => item.id === row.id)!
  assert.equal(saved.id, row.id)
  assert.equal(saved.startedAt, row.startedAt)
  assert.equal(saved.createdBy, row.createdBy)
  assert.deepEqual(saved.history.at(-1)?.fields, ['driverPhone'])
  state = applyCommand(
    state,
    'admin',
    { type: 'update', id: row.id, fields: { ...saved, driverPhone: '+44 20 7946 0000' } },
    NOW,
  )
  assert.equal(state.shipments.find((item) => item.id === row.id)?.driverPhone, '+44 20 7946 0000')
  state = applyCommand(
    state,
    'employee-1',
    { type: 'update', id: row.id, fields: { ...saved, driverPhone: '' } },
    NOW,
  )
  assert.equal(state.shipments.find((item) => item.id === row.id)?.driverPhone, '')
})

test('version-2 records without phone remain valid and a blank new field is not a phantom history change', () => {
  const state = createSeed(NOW)
  state.shipments.forEach((row) => {
    delete row.driverPhone
  })
  assert.equal(isDemoState(state), true)
  const row = state.shipments[0]!
  const edited = applyCommand(
    state,
    row.createdBy,
    { type: 'update', id: row.id, fields: { ...row, customer: 'Updated', driverPhone: '' } },
    NOW,
  )
  assert.deepEqual(edited.shipments[0]?.history.at(-1)?.fields, ['customer'])
  assert.equal(
    isDemoState({
      ...state,
      shipments: [{ ...row, driverPhone: 123 }, ...state.shipments.slice(1)],
    }),
    false,
  )
  assert.equal(
    isDemoState({
      ...state,
      shipments: [{ ...row, driverPhone: 'bad' }, ...state.shipments.slice(1)],
    }),
    false,
  )
})

test('local reload preserves legacy absence and later phone edits without reseeding records', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
  try {
    const state = createSeed(NOW)
    state.shipments.forEach((row) => {
      delete row.driverPhone
    })
    persistDemo(state)
    const rawBefore = values.get(DEMO_STORAGE_KEY)
    const loaded = loadDemo(NOW + 1000)
    assert.equal(loaded.issue, null)
    assert.deepEqual(loaded.state, state)
    assert.equal(values.get(DEMO_STORAGE_KEY), rawBefore)
    const row = state.shipments[0]!
    const edited = applyCommand(
      loaded.state,
      row.createdBy,
      { type: 'update', id: row.id, fields: { ...row, driverPhone: '+1 202-555-0145' } },
      NOW + 1000,
    )
    persistDemo(edited)
    const restored = loadDemo(NOW + 2000).state
    assert.equal(restored.shipments[0]?.driverPhone, '+1 202-555-0145')
    assert.equal(restored.shipments[0]?.startedAt, row.startedAt)
    assert.equal(restored.nextShipmentNumber, state.nextShipmentNumber)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
