import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  parseShipment,
  parseReadPage,
  parseHistoryPage,
  shipmentPresentation,
  defaultQuery,
} from '../src/features/connected/read-model.ts'
import { ReadResource } from '../src/features/connected/read-resource.ts'
import {
  connectedShipmentRepository,
  ShipmentReadError,
} from '../src/features/connected/repository.ts'
import type { SupabaseClient } from '@supabase/supabase-js'

const id = randomUUID()
const row = {
  id,
  owner_id: randomUUID(),
  number: '9007199254740993',
  display_id: 'TR-9007199254740993',
  revision: '9007199254740995',
  customer: 'عميل اختباري',
  origin: 'الرياض',
  destination: 'Jeddah',
  truck: 'TEST',
  driver: 'Driver',
  cargo: 'Cargo',
  driver_phone: '+966 50 123 4567',
  invoice_number: 'فاتورة-١',
  notes: 'سطر\nsecond line',
  started_at: '2026-10-24T00:00:00Z',
  updated_at: '2026-10-24T00:00:00Z',
  completed_at: null,
  deleted_at: null,
  deleted_by: null,
  workflow: 'pending',
  status: 'pending',
  server_now: '2026-10-28T00:00:00Z',
}
test('read mapping preserves UUID/display ID, bigint strings and optional Unicode fields', () => {
  const parsed = parseShipment(row)
  assert.equal(parsed.id, id)
  assert.equal(parsed.number, '9007199254740993')
  assert.equal(parsed.revision, '9007199254740995')
  const view = shipmentPresentation(parsed)
  assert.equal(view.id, row.display_id)
  assert.equal(view.driverPhone, row.driver_phone)
  assert.equal(view.invoice, row.invoice_number)
  assert.equal(view.notes, row.notes)
  assert.equal(view.invoiceImage, '')
  assert.equal(
    shipmentPresentation(
      parseShipment({ ...row, driver_phone: null, invoice_number: null, notes: null }),
    ).notes,
    '',
  )
})
test('status stays authoritative at sub-millisecond server boundaries and completed workflow is validated', () => {
  assert.equal(parseShipment(row).status, 'pending')
  assert.equal(
    parseShipment({ ...row, server_now: '2026-10-28T00:00:00.001Z', status: 'overdue' }).status,
    'overdue',
  )
  assert.equal(
    parseShipment({ ...row, server_now: '2026-10-28T00:00:00.000001Z', status: 'overdue' }).status,
    'overdue',
  )
  assert.throws(() => parseShipment({ ...row, status: 'completed' }))
  assert.equal(
    parseShipment({
      ...row,
      workflow: 'completed',
      completed_at: '2026-10-24T01:00:00Z',
      status: 'completed',
    }).status,
    'completed',
  )
})
test('invalid or lossy backend values fail closed, including integer counts', () => {
  for (const patch of [
    { number: Number('9007199254740993') },
    { revision: 2 },
    { display_id: 'TR-0001' },
    { id: 'bad' },
    { notes: 1 },
  ])
    assert.throws(() => parseShipment({ ...row, ...patch }))
  const page = {
    rows: [row],
    total: '9007199254740993',
    counts: { total: '9007199254740993', pending: '1', completed: '0', overdue: '0' },
    server_now: row.server_now,
  }
  assert.equal(parseReadPage(page).total, page.total)
  assert.throws(() => parseReadPage({ ...page, total: Number('9007199254740993') }))
  assert.throws(() =>
    parseHistoryPage(
      {
        rows: [{ id: randomUUID(), shipment_id: randomUUID() }],
        total: '1',
        server_now: row.server_now,
      },
      id,
    ),
  )
})
test('clearing a session resource discards cached data and ignores late responses even without abort support', async () => {
  let resolve!: (value: string) => void
  const resource = new ReadResource(
    () =>
      new Promise<string>((r) => {
        resolve = r
      }),
  )
  const loading = resource.load()
  resource.clear()
  resolve('old employee data')
  await loading
  assert.deepEqual(resource.getSnapshot(), { status: 'loading', data: null, problem: null })
  const next = resource.load()
  resolve('current employee data')
  await next
  assert.equal(resource.getSnapshot().data, 'current employee data')
  resource.clear()
  assert.equal(resource.getSnapshot().data, null)
})
test('a failed refresh removes previously loaded data and supports retry', async () => {
  let fail: 'denied' | 'network' | null = null
  const resource = new ReadResource(async () => {
    if (fail === 'denied') throw new ShipmentReadError('denied')
    if (fail === 'network') throw new TypeError('Connection unavailable')
    return 'authorized'
  })
  await resource.load()
  fail = 'denied'
  await resource.load()
  assert.deepEqual(resource.getSnapshot(), { status: 'error', data: null, problem: 'denied' })
  fail = 'network'
  await resource.load()
  assert.deepEqual(resource.getSnapshot(), { status: 'error', data: null, problem: 'network' })
  fail = null
  await resource.load()
  assert.equal(resource.getSnapshot().data, 'authorized')
})
test('adapter accepts only UUID identity for details and maps denied/not-found failures', async () => {
  let calls = 0
  const client = {
    rpc: () => {
      calls++
      return { abortSignal: async () => ({ data: [], error: null, status: 200 }) }
    },
  } as unknown as SupabaseClient
  const repo = connectedShipmentRepository(client),
    signal = new AbortController().signal
  await assert.rejects(repo.detail(row.display_id, signal), { problem: 'unavailable' })
  assert.equal(calls, 0)
  await assert.rejects(repo.detail(id, signal), { problem: 'unavailable' })
  assert.equal(calls, 1)
  for (const [status, problem] of [
    [401, 'denied'],
    [403, 'denied'],
    [404, 'unavailable'],
    [500, 'network'],
  ] as const) {
    const denied = connectedShipmentRepository({
      rpc: () => ({ abortSignal: async () => ({ error: { message: 'Generic failure' }, status }) }),
    } as unknown as SupabaseClient)
    await assert.rejects(denied.list(defaultQuery, signal), { problem })
  }
})
