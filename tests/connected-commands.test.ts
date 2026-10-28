import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { EMPTY_FIELDS } from '../src/features/shipments/model.ts'
import {
  commandArgs,
  fieldsForCommand,
  positiveBigint,
  completionFromInput,
} from '../src/features/connected/command-model.ts'
import {
  connectedCommandRepository,
  ShipmentCommandError,
} from '../src/features/connected/command-repository.ts'
import {
  CommandSession,
  clearCommandStorage,
  COMMAND_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  type CommandStorage,
} from '../src/features/connected/command-session.ts'
import { readFormDraft, saveFormDraft } from '../src/features/connected/form-draft.ts'
import type { ShipmentReadRepository } from '../src/features/connected/repository.ts'
import type { ReadShipment } from '../src/features/connected/read-model.ts'
import { ReadResource } from '../src/features/connected/read-resource.ts'

const userId = randomUUID(),
  id = randomUUID(),
  fields = fieldsForCommand({
    ...EMPTY_FIELDS,
    customer: ' عميل ',
    origin: 'الرياض',
    destination: 'Jeddah',
    truck: 'TEST',
    driver: 'Fictional',
    cargo: 'Goods',
    notes: ' سطر\nsecond ',
    driverPhone: '+966501234567',
    invoice: ' INV-١ ',
  })
const create = { operation: 'create', fields } as const
const receipt = {
  shipment_id: id,
  number: '9007199254740993',
  revision: '1',
  started_at: '2026-10-28T10:00:00Z',
  action: 'created' as const,
}
function storage() {
  const map = new Map<string, string>([['vs.demo.v1', 'preserve']])
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
  }
}
const reads = {
  detail: async () => ({ id, revision: '5' }) as ReadShipment,
} as unknown as ShipmentReadRepository

test('command fields exclude owner/start/TR/invoice bytes and preserve optional Unicode values', () => {
  assert.deepEqual(
    Object.keys(fields).sort(),
    [
      'cargo',
      'customer',
      'destination',
      'driver',
      'driver_phone',
      'invoice_number',
      'notes',
      'origin',
      'truck',
    ].sort(),
  )
  assert.equal(fields.customer, 'عميل')
  assert.equal(fields.notes, 'سطر\nsecond')
  assert.equal(fields.invoice_number, 'INV-١')
  assert.equal(fieldsForCommand({ ...EMPTY_FIELDS }).notes, null)
  const request = commandArgs(create, randomUUID())
  assert.equal(request.p_shipment_id, null)
  assert.equal(request.p_expected_revision, null)
  assert.throws(() =>
    commandArgs(
      { operation: 'create', fields: { ...fields, owner_id: userId } } as unknown as typeof create,
      randomUUID(),
    ),
  )
  assert.ok(Object.isFrozen(request) && Object.isFrozen(request.p_fields))
})
test('expected revisions stay positive signed-bigint strings without unsafe number conversion', () => {
  for (const value of ['9007199254740993', '9223372036854775807'])
    assert.equal(
      commandArgs({ operation: 'delete', id, revision: value }, randomUUID()).p_expected_revision,
      value,
    )
  for (const value of ['0', '-1', '01', '9223372036854775808', 1, null])
    assert.equal(positiveBigint(value), false)
})
test('manual completion uses Riyadh time, rejects impossible/future/pre-start times and ignores host timezone', () => {
  const start = '2026-10-28T10:00:00Z',
    now = Date.parse('2026-10-28T11:00:00Z')
  assert.equal(completionFromInput('2026-10-28T13:30', start, now), '2026-10-28T10:30:00.000Z')
  for (const value of [
    '2026-10-28T12:59:59',
    '2026-10-28T14:00:01',
    '2026-02-31T13:30',
    'not-a-date',
    '2026-10-28T13:30Z',
  ])
    assert.equal(completionFromInput(value, start, now), null)
})
test('adapter maps CAS SQLSTATE 40001/HTTP500 to conflict, and never enables automatic command retries', async () => {
  const cases = [
    ['40001', 'shipment_conflict', 500, 'conflict'],
    ['22023', 'idempotency_key_reused', 400, 'idempotency'],
    ['42501', 'access_denied', 403, 'denied'],
    ['PT404', 'record_unavailable', 404, 'unavailable'],
    ['22023', 'invalid_completion', 400, 'validation'],
    ['', 'offline', 0, 'uncertain'],
  ] as const
  for (const [code, message, status, problem] of cases) {
    let retry: unknown
    const client = {
      rpc: () => ({
        abortSignal: () => ({
          retry: (enabled: boolean) => {
            retry = enabled
            return Promise.resolve({ error: { code, message }, status })
          },
        }),
      }),
    } as unknown as SupabaseClient
    await assert.rejects(
      connectedCommandRepository(client).execute(
        commandArgs(create, randomUUID()),
        new AbortController().signal,
      ),
      { problem },
    )
    assert.equal(retry, false)
  }
})
test('an unknown result survives reload, retries the exact key/payload and re-fetches current row', async () => {
  const saved = storage(),
    calls: unknown[] = []
  let lost = true,
    readCount = 0
  const adapter = {
    execute: async (args: unknown) => {
      calls.push(args)
      if (lost) throw new ShipmentCommandError('uncertain')
      return receipt
    },
  }
  const first = new CommandSession(userId, adapter, reads, saved)
  assert.equal(await first.start(create), null)
  assert.equal(first.getSnapshot().status, 'uncertain')
  await first.start({ ...create, fields: { ...fields, customer: 'Must not send' } })
  assert.equal(calls.length, 1)
  first.dispose()
  lost = false
  const second = new CommandSession(
    userId,
    adapter,
    {
      ...reads,
      detail: async () => {
        readCount++
        return { id, revision: '5' } as ReadShipment
      },
    },
    saved,
  )
  await second.retry()
  assert.deepEqual(calls[0], calls[1])
  assert.equal(readCount, 1)
  assert.equal(second.getSnapshot().status, 'saved')
  assert.equal(saved.getItem(COMMAND_STORAGE_KEY), null)
  assert.equal(saved.getItem('vs.demo.v1'), 'preserve')
})
test('double clicks share one outstanding intent and a post-commit read failure never resubmits it', async () => {
  let resolve!: (value: typeof receipt) => void,
    calls = 0
  const adapter = {
    execute: async () => {
      calls++
      return new Promise<typeof receipt>((r) => {
        resolve = r
      })
    },
  }
  const session = new CommandSession(
    userId,
    adapter,
    {
      ...reads,
      detail: async () => {
        throw new TypeError('offline')
      },
    },
    storage(),
  )
  const pending = session.start(create)
  await session.start(create)
  assert.equal(calls, 1)
  resolve(receipt)
  await pending
  assert.equal(session.getSnapshot().status, 'refreshError')
  await session.retry()
  assert.equal(calls, 1)
  assert.equal(session.getSnapshot().receipt?.shipment_id, id)
})
test('known conflicts release the failed intent; a new explicitly reviewed intent uses a fresh key', async () => {
  const calls: string[] = []
  let conflict = true
  const session = new CommandSession(
    userId,
    {
      execute: async (args) => {
        calls.push(args.p_request_id)
        if (conflict) throw new ShipmentCommandError('conflict')
        return { ...receipt, action: 'updated' }
      },
    },
    reads,
    storage(),
  )
  await session.start({ operation: 'update', id, revision: '1', fields })
  assert.equal(session.getSnapshot().intent, null)
  assert.equal(session.getSnapshot().problem, 'conflict')
  conflict = false
  await session.start({ operation: 'update', id, revision: '2', fields })
  assert.notEqual(calls[0], calls[1])
})
test('logout/account change clears only command/draft namespaces; late completion cannot repopulate UI', async () => {
  const saved = storage()
  let resolve!: (value: typeof receipt) => void
  const session = new CommandSession(
    userId,
    {
      execute: () =>
        new Promise<typeof receipt>((r) => {
          resolve = r
        }),
    },
    reads,
    saved,
  )
  const pending = session.start(create)
  session.dispose()
  clearCommandStorage(saved)
  resolve(receipt)
  assert.equal(await pending, null)
  assert.equal(session.getSnapshot().receipt, null)
  assert.equal(saved.getItem('vs.demo.v1'), 'preserve')
  await new CommandSession(
    userId,
    {
      execute: async () => {
        throw new ShipmentCommandError('uncertain')
      },
    },
    reads,
    saved,
  ).start(create)
  const other = new CommandSession(randomUUID(), { execute: async () => receipt }, reads, saved)
  assert.equal(other.getSnapshot().intent, null)
  assert.equal(saved.getItem(COMMAND_STORAGE_KEY), null)
})
test('unavailable/corrupt recovery storage fails closed before issuing any command', async () => {
  let calls = 0
  const adapter = {
      execute: async () => {
        calls++
        return receipt
      },
    },
    saved = storage()
  const broken = {
    ...saved,
    setItem: () => {
      throw new Error('quota')
    },
  } as CommandStorage
  await new CommandSession(userId, adapter, reads, broken).start(create)
  assert.equal(calls, 0)
  saved.setItem(COMMAND_STORAGE_KEY, 'corrupt')
  await new CommandSession(userId, adapter, reads, saved).start(create)
  assert.equal(calls, 0)
})
test('form drafts retain original revision and unsaved values across reload, never across accounts', () => {
  const saved = storage(),
    draft = {
      userId,
      id,
      revision: '9007199254740993',
      fields: { ...EMPTY_FIELDS, customer: 'Unsaved' },
    }
  assert.equal(saveFormDraft(saved, draft), true)
  assert.deepEqual(readFormDraft(saved, userId, id), draft)
  assert.equal(readFormDraft(saved, randomUUID(), id), null)
  assert.equal(readFormDraft(saved, userId, randomUUID()), null)
  saved.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ ...draft, fields: { ...draft.fields, invoiceImage: 'forbidden' } }),
  )
  assert.equal(readFormDraft(saved, userId, id), null)
})
test('background reads preserve mounted forms/dialogs but remove data on denial', async () => {
  let fail = false
  const resource = new ReadResource(async () => {
    if (fail) throw new Error('denied')
    return 'authorized'
  })
  await resource.load()
  const pending = resource.load(true)
  assert.equal(resource.getSnapshot().data, 'authorized')
  await pending
  fail = true
  await resource.load(true)
  assert.equal(resource.getSnapshot().data, null)
})
