import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  reportDefaults,
  validReportQuery,
  parseReportPage,
  reportCsv,
  EXPORT_LIMIT,
  type ReportRow,
} from '../src/features/connected/report-model.ts'
import { connectedReportRepository } from '../src/features/connected/report-repository.ts'

const row: ReportRow = {
  id: randomUUID(),
  owner_id: randomUUID(),
  number: '9007199254740993',
  display_id: 'TR-9007199254740993',
  revision: '9007199254740995',
  customer: 'عميل',
  origin: 'الرياض',
  destination: 'Jeddah',
  truck: 'TEST',
  driver: 'Fictional',
  cargo: 'Cargo',
  driver_phone: '+966501234567',
  invoice_number: 'فاتورة-١',
  notes: 'سطر\nsecond',
  started_at: '2026-10-20T00:00:00Z',
  completed_at: null,
  report_completed_at: null,
  updated_at: '2026-10-20T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
  workflow: 'pending',
  status: 'overdue',
  server_now: '2026-10-28T10:00:00Z',
}
const page = {
  rows: [row],
  total: '1',
  counts: { total: '1', pending: '0', overdue: '1', completed: '0' },
  kind: 'operations',
  daily_counts: null,
  server_now: row.server_now,
  period_start: '2026-10-26T21:00:00Z',
  period_end: '2026-10-27T21:00:00Z',
  intended_delivery_at: '2026-10-28T05:00:00Z',
}
test('report queries reject impossible dates, reversed ranges, invalid scopes and excessive bounds', () => {
  assert.equal(validReportQuery(reportDefaults), true)
  assert.equal(
    validReportQuery({ ...reportDefaults, from: '2024-02-29', to: '2024-02-29', limit: 1000 }),
    true,
  )
  for (const patch of [
    { from: '2026-02-29' },
    { from: '2026-03-01', to: '2026-02-28' },
    { to: 'infinity' },
    { owner: 'forged' },
    { limit: 1001 },
    { offset: -1 },
    { status: 'deleted' },
    { kind: 'daily_starts', search: 'ignored?' },
    { kind: 'daily_starts', owner: row.owner_id },
  ])
    assert.equal(validReportQuery({ ...reportDefaults, ...patch } as typeof reportDefaults), false)
})
test('report envelopes preserve identifiers/int64/optional fields and reject lossy counts, deleted rows or invalid periods', () => {
  const parsed = parseReportPage(page, 'operations')
  assert.ok(parsed.rows[0])
  assert.equal(parsed.rows[0].revision, row.revision)
  assert.equal(parsed.rows[0].driver_phone, row.driver_phone)
  assert.equal(parsed.rows[0].notes, row.notes)
  for (const patch of [
    { total: 1 },
    { counts: { ...page.counts, overdue: 1 } },
    { period_end: '2026-10-28T00:00:00Z' },
    { intended_delivery_at: '2026-10-28T06:00:00Z' },
    { rows: [{ ...row, deleted_at: row.server_now, deleted_by: row.owner_id }] },
    { rows: [{ ...row, report_completed_at: 'bad' }] },
    { total: '0' },
  ])
    assert.throws(() => parseReportPage({ ...page, ...patch }, 'operations'))
  assert.throws(() =>
    parseReportPage(
      {
        ...page,
        kind: 'daily_starts',
        daily_counts: { daily_starts: 1, daily_completions: '0', daily_overdue: '1' },
      },
      'daily_starts',
    ),
  )
})
test('CSV quotes every spreadsheet-text cell, retains exact digits and neutralizes formula/control/full-width payloads', () => {
  for (const customer of [
    '=HYPERLINK("https://example.invalid")',
    ' +1',
    '-1',
    '@SUM(1)',
    '\t=1',
    '\r=1',
    '\n=1',
    '＝1',
    '＋1',
    '－1',
    '＠1',
    '\u200b=1',
    'a",=1',
    'عميل, "اسم"\nسطر',
  ]) {
    const csv = reportCsv(['عنوان'], [{ ...row, customer }])
    assert.ok(csv.startsWith('\ufeff"\'عنوان"\r\n'))
    assert.ok(csv.includes(`"'${customer.replaceAll('"', '""')}"`))
    assert.ok(csv.includes('"\'9007199254740993"'))
    assert.ok(csv.includes('"\'+966501234567"'))
    assert.ok(csv.includes('"\'سطر\nsecond"'))
  }
  assert.throws(() => reportCsv([], Array(EXPORT_LIMIT + 1).fill(row)))
})
test('report adapter sends only bounded typed filters and abort signal; permission errors fail closed', async () => {
  let sent: unknown, usedSignal: unknown
  const signal = new AbortController().signal
  let denied = false
  const client = {
    rpc: (name: string, args: unknown) => {
      sent = { name, args }
      return {
        abortSignal: (s: unknown) => {
          usedSignal = s
          return Promise.resolve(
            denied ? { error: { message: 'denied' }, status: 403 } : { data: page, status: 200 },
          )
        },
      }
    },
  } as unknown as SupabaseClient
  const repo = connectedReportRepository(client)
  await repo.page({ ...reportDefaults, from: '2026-10-27', owner: row.owner_id }, signal)
  assert.deepEqual(sent, {
    name: 'read_operational_report',
    args: {
      p_kind: 'operations',
      p_search: '',
      p_status: '',
      p_owner: row.owner_id,
      p_from: '2026-10-27',
      p_to: null,
      p_date_field: 'started',
      p_limit: 10,
      p_offset: 0,
    },
  })
  assert.equal(usedSignal, signal)
  denied = true
  await assert.rejects(repo.page(reportDefaults, signal), { problem: 'denied' })
  await assert.rejects(repo.page({ ...reportDefaults, limit: 1001 }, signal), {
    problem: 'unavailable',
  })
})
