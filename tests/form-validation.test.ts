import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY_FIELDS,
  REQUIRED_SHIPMENT_FIELDS,
  normalizeFields,
} from '../src/features/shipments/model.ts'
import {
  firstInvalidField,
  validateShipmentForm,
} from '../src/features/shipments/form-validation.ts'

const valid = {
  ...EMPTY_FIELDS,
  customer: 'QA customer',
  origin: 'Riyadh',
  destination: 'Jeddah',
  truck: 'QA-29',
  driver: 'QA driver',
  cargo: 'Demo cargo',
}

test('empty form identifies all six required fields and focuses the first in tab order', () => {
  const errors = validateShipmentForm(EMPTY_FIELDS)
  assert.deepEqual(Object.keys(errors), [...REQUIRED_SHIPMENT_FIELDS])
  assert.equal(firstInvalidField(errors), 'customer')
  assert.equal(errors.driverPhone, undefined)
})
test('one or multiple missing fields are identified without changing entered values', () => {
  const fields = { ...valid, origin: '   ', driver: '' }
  const before = structuredClone(fields)
  assert.deepEqual(validateShipmentForm(fields), {
    origin: 'fieldRequired',
    driver: 'fieldRequired',
  })
  assert.equal(firstInvalidField(validateShipmentForm(fields)), 'origin')
  assert.deepEqual(fields, before)
  assert.deepEqual(validateShipmentForm({ ...fields, origin: 'الرياض' }), {
    driver: 'fieldRequired',
  })
  assert.deepEqual(validateShipmentForm({ ...fields, origin: 'الرياض', driver: 'سائق تجريبي' }), {})
})
test('optional invoice and phone remain optional; phone validation respects tab order and Arabic digits', () => {
  assert.deepEqual(validateShipmentForm(valid), {})
  assert.deepEqual(validateShipmentForm({ ...valid, driverPhone: '٠٥٠٠٠٠٠٠٠٠' }), {})
  const errors = validateShipmentForm({ ...valid, driverPhone: 'bad', cargo: '' })
  assert.equal(errors.driverPhone, 'invalidDriverPhone')
  assert.equal(firstInvalidField(errors), 'driverPhone')
  assert.equal(firstInvalidField(validateShipmentForm(valid)), undefined)
})
test('length feedback matches the unchanged trimmed domain limit', () => {
  assert.deepEqual(validateShipmentForm({ ...valid, customer: 'أ'.repeat(200) }), {})
  assert.equal(
    validateShipmentForm({ ...valid, customer: 'أ'.repeat(201) }).customer,
    'fieldTooLong',
  )
  assert.throws(() => normalizeFields({ ...valid, customer: 'أ'.repeat(201) }))
  assert.deepEqual(validateShipmentForm({ ...valid, customer: `  ${'أ'.repeat(200)} ` }), {})
})
