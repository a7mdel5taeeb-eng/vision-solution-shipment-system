import test from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../src/app/demo/seed.ts'
import { isDemoState, loadDemo, persistDemo, DEMO_STORAGE_KEY } from '../src/app/demo/repository.ts'
import {
  applyCommand,
  canAccess,
  DomainError,
  EMPTY_FIELDS,
  HOUR,
  isLateCompletion,
  OVERDUE_AFTER,
  shipmentTotals,
  statusOf,
  visibleShipments,
  type ShipmentFields,
} from '../src/features/shipments/model.ts'
import { queryShipments } from '../src/features/shipments/query.ts'
import { dailyReport, effectiveCompletion, toCsv } from '../src/features/reports/report-model.ts'
import {
  dateKey,
  dateTimeInput,
  fromRiyadhInput,
  inDateRange,
  previousDayRange,
} from '../src/shared/lib/dates.ts'

const NOW = Date.parse('2026-10-26T09:00:00Z')
const fields: ShipmentFields = {
  ...EMPTY_FIELDS,
  customer: '  Fictional Test Supplies  ',
  origin: 'Riyadh',
  destination: 'Jeddah',
  truck: 'DEMO-100',
  driver: 'Test Driver',
  cargo: 'Test cargo',
}
const employee = 'employee-1'
const domainError = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code

test('seed has 32 fictional records, all states and late completions; every employee has mixed work', () => {
  const state = createSeed(NOW)
  assert.equal(state.shipments.length, 32)
  assert.ok(isDemoState(state))
  const counts = shipmentTotals(state.shipments, NOW)
  assert.equal(counts.total, counts.pending + counts.completed + counts.overdue)
  assert.ok(counts.pending && counts.completed && counts.overdue)
  assert.ok(state.shipments.some(isLateCompletion))
  for (const user of state.users.filter((item) => item.role === 'employee')) {
    const own = visibleShipments(state, user)
    assert.ok(own.some((row) => row.workflow === 'completed'))
    assert.ok(own.some((row) => row.workflow === 'pending'))
  }
})

test('overdue starts strictly after 96 hours; workflow remains pending', () => {
  const row = {
    ...createSeed(NOW).shipments[1]!,
    startedAt: new Date(NOW - OVERDUE_AFTER).toISOString(),
    workflow: 'pending' as const,
    completedAt: null,
  }
  assert.equal(statusOf(row, NOW), 'pending')
  assert.equal(statusOf(row, NOW + 1), 'overdue')
  assert.equal(row.workflow, 'pending')
})

test('completed shipments never become overdue, including late completions', () => {
  const row = createSeed(NOW).shipments.find(isLateCompletion)!
  assert.equal(statusOf(row, NOW + 100 * HOUR), 'completed')
})

test('create assigns immutable owner, automatic start, pending workflow and a monotonic ID', () => {
  const initial = createSeed(NOW)
  const next = applyCommand(initial, employee, { type: 'create', fields }, NOW)
  const row = next.shipments[0]!
  assert.equal(row.id, 'TR-0033')
  assert.equal(row.createdBy, employee)
  assert.equal(row.startedAt, new Date(NOW).toISOString())
  assert.equal(row.workflow, 'pending')
  assert.equal(row.customer, 'Fictional Test Supplies')
  assert.equal(next.nextShipmentNumber, 34)
  assert.equal(initial.shipments.length, 32)
})

test('required and oversized fields and unsafe images are rejected', () => {
  const state = createSeed(NOW)
  assert.throws(
    () => applyCommand(state, employee, { type: 'create', fields: { ...fields, cargo: ' ' } }, NOW),
    domainError('requiredFields'),
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        employee,
        { type: 'create', fields: { ...fields, customer: 'x'.repeat(201) } },
        NOW,
      ),
    domainError('requiredFields'),
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        employee,
        { type: 'create', fields: { ...fields, invoiceImage: 'data:image/svg+xml;base64,AAAA' } },
        NOW,
      ),
    domainError('invalidImage'),
  )
})

test('a newly registered shipment can be completed immediately with second-precision input', () => {
  const initial = createSeed(NOW)
  const next = applyCommand(initial, employee, { type: 'create', fields }, NOW + 789)
  const row = next.shipments[0]!
  assert.equal(row.startedAt, new Date(NOW).toISOString())
  const completed = applyCommand(
    next,
    employee,
    { type: 'complete', id: row.id, completedAt: fromRiyadhInput(dateTimeInput(NOW + 800)) },
    NOW + 800,
  )
  assert.equal(completed.shipments[0]?.workflow, 'completed')
})

test('own edits preserve start/owner, update invoice and notes, and append history', () => {
  const state = createSeed(NOW)
  const row = state.shipments.find(
    (item) => item.createdBy === employee && item.workflow === 'pending',
  )!
  const next = applyCommand(
    state,
    employee,
    {
      type: 'update',
      id: row.id,
      fields: { ...row, invoice: 'INV-LOCAL', notes: 'Revised loading point' },
    },
    NOW,
  )
  const edited = next.shipments.find((item) => item.id === row.id)!
  assert.equal(edited.startedAt, row.startedAt)
  assert.equal(edited.createdBy, row.createdBy)
  assert.equal(edited.invoice, 'INV-LOCAL')
  assert.equal(edited.notes, 'Revised loading point')
  assert.deepEqual(edited.history.at(-1)?.fields, ['invoice', 'notes'])
  assert.equal(row.invoice, '')
})

test('employee cannot view or mutate another owner’s shipments', () => {
  const state = createSeed(NOW)
  const actor = state.users.find((user) => user.id === employee)!
  const other = state.shipments.find((row) => row.createdBy !== employee)!
  assert.equal(canAccess(actor, other), false)
  assert.ok(visibleShipments(state, actor).every((row) => row.createdBy === employee))
  assert.throws(
    () => applyCommand(state, employee, { type: 'update', id: other.id, fields }, NOW),
    domainError('recordUnavailable'),
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        employee,
        { type: 'complete', id: other.id, completedAt: new Date(NOW).toISOString() },
        NOW,
      ),
    domainError('recordUnavailable'),
  )
})

test('employee cannot delete their own shipment or manage users/recipients', () => {
  const state = createSeed(NOW)
  const own = state.shipments.find((row) => row.createdBy === employee)!
  assert.throws(
    () => applyCommand(state, employee, { type: 'delete', id: own.id }, NOW),
    domainError('accessDenied'),
  )
  assert.throws(
    () => applyCommand(state, employee, { type: 'recipients', recipients: [] }, NOW),
    domainError('accessDenied'),
  )
  assert.throws(
    () => applyCommand(state, employee, { type: 'saveUser', user: state.users[0]! }, NOW),
    domainError('accessDenied'),
  )
})

test('completion requires a valid timestamp between start and now; edits are recorded', () => {
  const state = createSeed(NOW)
  const row = state.shipments.find(
    (item) => item.createdBy === employee && item.workflow === 'pending',
  )!
  for (const completedAt of [
    '',
    'invalid',
    new Date(Date.parse(row.startedAt) - 1).toISOString(),
    new Date(NOW + 1).toISOString(),
  ]) {
    assert.throws(
      () => applyCommand(state, employee, { type: 'complete', id: row.id, completedAt }, NOW),
      domainError('invalidCompletion'),
    )
  }
  const first = applyCommand(
    state,
    employee,
    { type: 'complete', id: row.id, completedAt: new Date(NOW - HOUR).toISOString() },
    NOW,
  )
  const edited = applyCommand(
    first,
    employee,
    { type: 'complete', id: row.id, completedAt: new Date(NOW).toISOString() },
    NOW,
  )
  const complete = edited.shipments.find((item) => item.id === row.id)!
  assert.equal(complete.history.at(-1)?.action, 'completionEdited')
  assert.equal(complete.completedAt, new Date(NOW).toISOString())
})

test('reopening a late completion retains original start and immediately recalculates overdue', () => {
  const state = createSeed(NOW)
  const row = state.shipments.find(isLateCompletion)!
  const next = applyCommand(state, row.createdBy, { type: 'reopen', id: row.id }, NOW)
  const reopened = next.shipments.find((item) => item.id === row.id)!
  assert.equal(reopened.startedAt, row.startedAt)
  assert.equal(reopened.completedAt, null)
  assert.equal(reopened.workflow, 'pending')
  assert.equal(statusOf(reopened, NOW), 'overdue')
  assert.equal(effectiveCompletion(reopened), row.completedAt)
})

test('soft deletion hides data from operational totals and employees; restoration keeps history and ID sequence', () => {
  const state = createSeed(NOW)
  const row = state.shipments.find((item) => item.createdBy === employee)!
  const deleted = applyCommand(state, 'admin', { type: 'delete', id: row.id }, NOW)
  assert.equal(deleted.shipments.length, state.shipments.length)
  assert.equal(visibleShipments(deleted, state.users[0]!).length, 31)
  assert.equal(visibleShipments(deleted, state.users[0]!, true).length, 32)
  assert.ok(!visibleShipments(deleted, state.users[1]!, true).some((item) => item.id === row.id))
  assert.throws(
    () => applyCommand(deleted, employee, { type: 'restore', id: row.id }, NOW),
    domainError('recordUnavailable'),
  )
  const restored = applyCommand(deleted, 'admin', { type: 'restore', id: row.id }, NOW)
  const recovered = restored.shipments.find((item) => item.id === row.id)!
  assert.equal(recovered.deletedAt, null)
  assert.equal(recovered.startedAt, row.startedAt)
  assert.equal(recovered.history.at(-2)?.action, 'deleted')
  assert.equal(recovered.history.at(-1)?.action, 'restored')
  assert.equal(restored.nextShipmentNumber, state.nextShipmentNumber)
})

test('inactive users cannot mutate; current admin cannot deactivate or demote self', () => {
  const state = createSeed(NOW)
  const inactive = applyCommand(
    state,
    'admin',
    { type: 'saveUser', user: { ...state.users[1]!, active: false } },
    NOW,
  )
  assert.throws(
    () => applyCommand(inactive, employee, { type: 'create', fields }, NOW),
    domainError('accessDenied'),
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        'admin',
        { type: 'saveUser', user: { ...state.users[0]!, active: false } },
        NOW,
      ),
    domainError('selfUserChange'),
  )
  assert.throws(
    () =>
      applyCommand(
        state,
        'admin',
        { type: 'saveUser', user: { ...state.users[0]!, role: 'employee' } },
        NOW,
      ),
    domainError('selfUserChange'),
  )
})

test('recipient settings validate and deduplicate addresses without sending anything', () => {
  const state = createSeed(NOW)
  const next = applyCommand(
    state,
    'admin',
    { type: 'recipients', recipients: [' LOCAL@demo.example ', 'local@demo.example'] },
    NOW,
  )
  assert.deepEqual(next.recipients, ['local@demo.example'])
  assert.throws(
    () => applyCommand(state, 'admin', { type: 'recipients', recipients: ['bad-address'] }, NOW),
    domainError('invalidEmail'),
  )
})

test('Riyadh previous calendar day uses midnight boundaries rather than a rolling 24-hour window', () => {
  const now = Date.parse('2026-10-25T21:30:00Z')
  const range = previousDayRange(now)
  assert.equal(new Date(range.start).toISOString(), '2026-10-24T21:00:00.000Z')
  assert.equal(new Date(range.end).toISOString(), '2026-10-25T21:00:00.000Z')
  assert.equal(dateKey(now), '2026-10-26')
})

test('date filters include the complete Riyadh end date and datetime inputs round-trip independently of host timezone', () => {
  assert.equal(inDateRange('2026-10-26T23:59:59+03:00', '2026-10-26', '2026-10-26'), true)
  assert.equal(inDateRange('2026-10-27T00:00:00+03:00', '2026-10-26', '2026-10-26'), false)
  assert.equal(dateTimeInput(NOW), '2026-10-26T12:00:00')
  assert.equal(Date.parse(fromRiyadhInput(dateTimeInput(NOW))), NOW)
  assert.equal(fromRiyadhInput('2026-10-26T12:00'), '2026-10-26T12:00:00+03:00')
})

test('daily digest has yesterday activity, all currently overdue, and excludes deleted records', () => {
  const state = createSeed(NOW)
  const report = dailyReport(state.shipments, NOW)
  assert.ok(report.started.length >= 3)
  assert.ok(report.completed.length >= 1)
  assert.ok(report.overdue.some((row) => Date.parse(row.startedAt) < report.start))
  assert.equal(
    report.outstanding.length,
    state.shipments.filter((row) => row.workflow === 'pending').length,
  )
  const row = report.overdue[0]!
  const deleted = applyCommand(state, 'admin', { type: 'delete', id: row.id }, NOW)
  assert.ok(!dailyReport(deleted.shipments, NOW).overdue.some((item) => item.id === row.id))
})

test('query supports Arabic search, deterministic sorting and role-scoped rows', () => {
  const state = createSeed(NOW)
  const actor = state.users[1]!
  const rows = visibleShipments(state, actor)
  const query = {
    search: 'الرياض',
    status: '',
    employee: '',
    sort: 'idAscending' as const,
    locale: 'ar',
  }
  const found = queryShipments(rows, state.users, query, NOW)
  assert.ok(found.length > 0)
  assert.ok(found.every((row) => row.createdBy === actor.id))
  const overdue = queryShipments(
    rows,
    state.users,
    { ...query, search: '', status: 'overdue' },
    NOW,
  )
  assert.ok(overdue.every((row) => statusOf(row, NOW) === 'overdue'))
})

test('CSV supports Arabic, commas, newlines, quotes, BOM and spreadsheet formula protection', () => {
  const csv = toCsv([
    ['العميل', 'a,b', 'line\nbreak', 'a"b', '=1+1', '  @SUM(1)', '\tformula', 'plain'],
  ])
  assert.ok(csv.startsWith('\ufeff'))
  assert.ok(csv.includes('"a,b"'))
  assert.ok(csv.includes('"a""b"'))
  assert.ok(csv.includes('"\'=1+1"'))
  assert.ok(csv.includes('"\'  @SUM(1)"'))
  assert.ok(csv.includes('"\'\tformula"'))
  assert.ok(toCsv([['a'], ['b']]).includes('\r\n'))
})

test('persisted schema rejects corrupt identities and sequence collisions', () => {
  const state = createSeed(NOW)
  assert.equal(isDemoState({ ...state, version: 1 }), false)
  assert.equal(isDemoState({ ...state, nextShipmentNumber: 1 }), false)
  assert.equal(
    isDemoState({ ...state, shipments: [...state.shipments, state.shipments[0]] }),
    false,
  )
  assert.equal(
    isDemoState({ ...state, users: state.users.map((user) => ({ ...user, active: false })) }),
    false,
  )
})

test('repository reloads saved changes and preserves unreadable data until an explicit reset', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
  try {
    const initial = loadDemo(NOW)
    assert.equal(initial.issue, null)
    const next = applyCommand(initial.state, employee, { type: 'create', fields }, NOW)
    persistDemo(next)
    assert.equal(loadDemo(NOW + HOUR).state.shipments.length, 33)
    values.set(DEMO_STORAGE_KEY, '{broken')
    assert.equal(loadDemo(NOW).issue, 'corruptData')
    assert.equal(values.get(DEMO_STORAGE_KEY), '{broken')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied')
        },
      },
    })
    assert.equal(loadDemo(NOW).issue, 'storageUnavailable')
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
