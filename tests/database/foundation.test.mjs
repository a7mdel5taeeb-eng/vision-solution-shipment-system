import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import { validDriverPhone } from '../../src/shared/lib/phone.ts'
import { json, quote as q, requireLocalDatabase, sql } from './local-postgres.mjs'

const actors = { a: randomUUID(), b: randomUUID(), admin: randomUUID(), inactive: randomUUID() }
const ids = Object.values(actors).map(q).join(',')
const fields = {
  customer: 'عميل تجريبي / Fictional customer',
  origin: 'الرياض',
  destination: 'Jeddah',
  truck: 'TEST-TRUCK',
  driver: 'Fictional Driver',
  cargo: 'Test cargo',
}
const admin = { aal: 'aal2' }
let ownA
let ownB
let initialized = false

async function command(
  actor,
  operation,
  {
    id = null,
    revision = null,
    data = {},
    completion = null,
    request = randomUUID(),
    options,
  } = {},
) {
  return json(
    `select public.shipment_command(${q(operation)}, ${q(request)}::uuid, ${q(id)}::uuid, ${revision ?? 'null'}::bigint, ${q(JSON.stringify(data))}::jsonb, ${q(completion)}::timestamptz);`,
    actor,
    options,
  )
}
const create = (actor = actors.a, data = fields, request) =>
  command(actor, 'create', { data, request })
const row = (id, actor = actors.a, options) =>
  json(
    `select coalesce(jsonb_agg(s), '[]') from public.get_shipments(${q(id)}::uuid) s;`,
    actor,
    options,
  )
const history = (id, actor = actors.a, options) =>
  json(
    `select coalesce(jsonb_agg(e), '[]') from public.get_shipment_history(${q(id)}::uuid) e;`,
    actor,
    options,
  )

before(async () => {
  await requireLocalDatabase()
  // Fresh random identities, no credentials or emails sent. Never seed the frontend.
  await sql(`insert into auth.users(id,email) select id, 'phase3b-' || id || '@example.invalid' from unnest(array[${ids}]::uuid[]) id;
    insert into public.profiles(id,name) select id, 'Fictional database test user' from unnest(array[${ids}]::uuid[]) id;
    insert into app_private.account_access(user_id,role,active) values
      (${q(actors.a)},'employee',true),(${q(actors.b)},'employee',true),
      (${q(actors.admin)},'admin',true),(${q(actors.inactive)},'employee',false);`)
  initialized = true
  ownA = await create(actors.a, { ...fields, driver_phone: '+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧' })
  ownB = await create(actors.b)
  await sql(`insert into public.invoice_files(shipment_id,object_key,uploaded_by) values
    (${q(ownA.shipment_id)},${q(randomUUID())},${q(actors.a)}),
    (${q(ownB.shipment_id)},${q(randomUUID())},${q(actors.b)});
    insert into public.admin_events(actor_id,action) values (${q(actors.admin)},'fictional_test_setup');
    insert into public.report_recipients(email) values (${q(`phase3b-${actors.admin}@example.invalid`)});`)
})

after(async () => {
  if (!initialized) return
  // Operator-only cleanup of records belonging to this run's freshly generated UUIDs.
  await sql(`delete from public.invoice_files where uploaded_by in (${ids});
    delete from public.shipment_events where shipment_id in (select id from public.shipments where owner_id in (${ids}));
    delete from app_private.command_receipts where actor_id in (${ids});
    delete from public.admin_events where actor_id in (${ids});
    delete from public.report_recipients where email = ${q(`phase3b-${actors.admin}@example.invalid`)};
    delete from public.shipments where owner_id in (${ids});
    delete from app_private.account_access where user_id in (${ids});
    delete from public.profiles where id in (${ids}); delete from auth.users where id in (${ids});`)
})

test('employee A reads own shipment, Unicode, optional phone, server ID/time and string bigints', async () => {
  const [shipment] = await row(ownA.shipment_id)
  assert.equal(shipment.owner_id, actors.a)
  assert.equal(shipment.customer, fields.customer)
  assert.equal(shipment.driver_phone, '+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧')
  assert.match(shipment.display_id, /^TR-\d{4,}$/)
  assert.equal(typeof shipment.number, 'string')
  assert.equal(shipment.revision, '1')
  assert.equal(shipment.workflow, 'pending')
  assert.equal(shipment.status, 'pending')
  assert.ok(Date.now() - Date.parse(shipment.started_at) < 60000)
})

test('employee A cannot read or edit employee B through tables, RPCs, history or invoice metadata', async () => {
  assert.deepEqual(await row(ownB.shipment_id), [])
  assert.deepEqual(await history(ownB.shipment_id), [])
  assert.equal(
    await sql(`select count(*) from public.shipments where id = ${q(ownB.shipment_id)};`, actors.a),
    '0',
  )
  assert.equal(
    await sql(
      `select count(*) from public.invoice_files where shipment_id = ${q(ownB.shipment_id)};`,
      actors.a,
    ),
    '0',
  )
  await assert.rejects(
    command(actors.a, 'update', { id: ownB.shipment_id, revision: 1, data: fields }),
    /P0002/,
  )
})

test('administrator with MFA sees both employees; administrator without MFA has no operational access', async () => {
  assert.equal((await row(ownA.shipment_id, actors.admin, admin)).length, 1)
  assert.equal((await row(ownB.shipment_id, actors.admin, admin)).length, 1)
  assert.equal(
    await sql(`select count(*) from public.shipments where owner_id in (${ids});`, actors.admin),
    '0',
  )
  await assert.rejects(row(ownA.shipment_id, actors.admin), /42501/)
  await assert.rejects(command(actors.admin, 'create', { data: fields }), /42501/)
})

test('anonymous, unknown and inactive identities cannot read or mutate operational records', async () => {
  await assert.rejects(sql('select * from public.shipments;', actors.a, { role: 'anon' }), /42501/)
  for (const actor of [actors.inactive, randomUUID()]) {
    assert.equal(await sql('select count(*) from public.shipments;', actor), '0')
    await assert.rejects(create(actor), /42501/)
  }
})

test('employee and administrator direct table writes, hard deletes, profile writes and role changes are rejected', async () => {
  for (const [actor, options] of [
    [actors.a, {}],
    [actors.admin, admin],
  ]) {
    for (const statement of [
      `update public.shipments set customer = 'BYPASS' where id = ${q(ownA.shipment_id)};`,
      `delete from public.shipments where id = ${q(ownA.shipment_id)};`,
      `insert into public.shipments(owner_id,customer,origin,destination,truck,driver,cargo) values (${q(actor)},'x','x','x','x','x','x');`,
      `update public.profiles set name = 'BYPASS' where id = ${q(actor)};`,
      `update app_private.account_access set role = 'admin' where user_id = ${q(actor)};`,
      'truncate public.shipment_events;',
    ])
      await assert.rejects(sql(statement, actor, options), /42501/)
  }
})

test('browser-controlled metadata and forged owner/start fields cannot escalate privileges', async () => {
  assert.deepEqual(
    await row(ownB.shipment_id, actors.a, { metadata: { role: 'admin', active: true } }),
    [],
  )
  for (const key of [
    'owner_id',
    'started_at',
    'number',
    'revision',
    'deleted_at',
    'invoiceImage',
  ]) {
    await assert.rejects(create(actors.a, { ...fields, [key]: actors.b }), /22023/)
  }
  assert.equal(
    await sql(
      "select pg_has_role('authenticated','vs_command_writer','MEMBER') or pg_has_role('authenticated','vs_access_reader','MEMBER');",
    ),
    'f',
  )
})

test('employees cannot soft-delete or restore even their own shipment', async () => {
  for (const operation of ['delete', 'restore']) {
    await assert.rejects(
      command(actors.a, operation, { id: ownA.shipment_id, revision: 1 }),
      /42501/,
    )
  }
  assert.equal((await history(ownA.shipment_id)).length, 1)
})

test('parallel creates generate distinct server numbers and UUIDs', async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, index) => create(index % 2 ? actors.a : actors.b)),
  )
  assert.equal(new Set(results.map((result) => result.number)).size, 8)
  assert.equal(new Set(results.map((result) => result.shipment_id)).size, 8)
  for (const result of results) assert.ok(BigInt(result.number) > 0n)
})

test('simultaneous duplicate requests create one shipment/event; payload reuse is rejected', async () => {
  const request = randomUUID()
  const results = await Promise.all(
    Array.from({ length: 4 }, () => create(actors.a, fields, request)),
  )
  assert.ok(results.every((result) => result.shipment_id === results[0].shipment_id))
  assert.equal((await history(results[0].shipment_id)).length, 1)
  await assert.rejects(create(actors.a, { ...fields, cargo: 'different' }, request), /22023/)
})

test('concurrent edits enforce expected revision: one wins, one conflicts, no lost update', async () => {
  const shipment = await create()
  const results = await Promise.allSettled(
    ['First', 'Second'].map((cargo) =>
      command(actors.a, 'update', {
        id: shipment.shipment_id,
        revision: 1,
        data: { ...fields, cargo },
      }),
    ),
  )
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.match(results.find((result) => result.status === 'rejected').reason.message, /40001/)
  assert.equal((await row(shipment.shipment_id))[0].revision, '2')
  assert.equal((await history(shipment.shipment_id)).length, 2)
})

test('complete, edit completion and reopen retain original start and accurate audit history', async () => {
  const shipment = await create()
  const initial = (await row(shipment.shipment_id))[0]
  await command(actors.a, 'complete', {
    id: shipment.shipment_id,
    revision: 1,
    completion: initial.started_at,
  })
  await command(actors.a, 'complete', {
    id: shipment.shipment_id,
    revision: 2,
    completion: initial.started_at,
  })
  await command(actors.a, 'reopen', { id: shipment.shipment_id, revision: 3 })
  const [reopened] = await row(shipment.shipment_id)
  assert.equal(reopened.started_at, initial.started_at)
  assert.equal(reopened.completed_at, null)
  assert.equal(reopened.workflow, 'pending')
  const events = await history(shipment.shipment_id)
  assert.deepEqual(
    events.map((event) => event.action),
    ['created', 'completed', 'completionEdited', 'reopened'],
  )
  assert.ok(events[1].completed_at)
  assert.ok(events.every((event) => event.actor_id === actors.a))
})

test('future, pre-start, infinite and missing completion timestamps fail atomically', async () => {
  const shipment = await create()
  for (const completion of ['2000-01-01T00:00:00Z', '2999-01-01T00:00:00Z', 'infinity', null]) {
    await assert.rejects(
      command(actors.a, 'complete', { id: shipment.shipment_id, revision: 1, completion }),
      /22023/,
    )
  }
  assert.equal((await row(shipment.shipment_id))[0].revision, '1')
  assert.equal((await history(shipment.shipment_id)).length, 1)
})

test('96-hour boundary is pending exactly, overdue strictly after, completed remains completed', async () => {
  const status = await json(
    `select jsonb_build_array(
    app_private.shipment_status('pending','2026-01-01Z','2026-01-05Z'),
    app_private.shipment_status('pending','2026-01-01Z','2026-01-05 00:00:00.000001Z'),
    app_private.shipment_status('completed','2026-01-01Z','2026-02-01Z'));`,
    actors.a,
  )
  assert.deepEqual(status, ['pending', 'overdue', 'completed'])
})

test('only MFA administrator soft-deletes/restores; history and immutable identity are preserved', async () => {
  const shipment = await create()
  const [initial] = await row(shipment.shipment_id)
  await command(actors.admin, 'delete', { id: shipment.shipment_id, revision: 1, options: admin })
  assert.deepEqual(await row(shipment.shipment_id), [])
  assert.deepEqual(await history(shipment.shipment_id), [])
  const [deleted] = await row(shipment.shipment_id, actors.admin, admin)
  assert.equal(deleted.deleted_by, actors.admin)
  await command(actors.admin, 'restore', { id: shipment.shipment_id, revision: 2, options: admin })
  const [restored] = await row(shipment.shipment_id)
  assert.equal(restored.started_at, initial.started_at)
  assert.equal(restored.number, initial.number)
  assert.equal(restored.owner_id, initial.owner_id)
  assert.deepEqual(
    (await history(shipment.shipment_id)).map((event) => event.action),
    ['created', 'deleted', 'restored'],
  )
})

test('audit events cannot be inserted, altered or deleted by ordinary users including app administrators', async () => {
  for (const [actor, options] of [
    [actors.a, {}],
    [actors.admin, admin],
  ]) {
    for (const statement of [
      `update public.shipment_events set action = 'restored' where shipment_id = ${q(ownA.shipment_id)};`,
      `delete from public.shipment_events where shipment_id = ${q(ownA.shipment_id)};`,
      `insert into public.shipment_events(shipment_id,actor_id,action,revision) values (${q(ownA.shipment_id)},${q(actor)},'created',99);`,
      `delete from public.admin_events where actor_id = ${q(actors.admin)};`,
    ])
      await assert.rejects(sql(statement, actor, options), /42501/)
  }
})

test('deactivation is immediate for an existing identity regardless of JWT metadata', async () => {
  await sql(`update app_private.account_access set active = false where user_id = ${q(actors.b)};`)
  try {
    assert.equal(
      await sql('select count(*) from public.shipments;', actors.b, {
        metadata: { active: true, role: 'admin' },
      }),
      '0',
    )
    await assert.rejects(create(actors.b), /42501/)
  } finally {
    await sql(`update app_private.account_access set active = true where user_id = ${q(actors.b)};`)
  }
})

test('optional phone validation matches existing formatting/Arabic/Persian/extension rules', async () => {
  const values = [
    '',
    '+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧',
    '۰۰۹۶۶ ۵۰ ۱۲۳ ۴۵۶۷',
    '+44 (0)20 7946 0958 ext. 12',
    '5551234567;ext=123',
    '123',
    'javascript:1234567',
    '++966501234567',
    '1234567890123456',
    '5551234567 x12345678901',
  ]
  for (const value of values) {
    assert.equal(
      await sql(`select app_private.valid_phone(${q(value)});`, actors.a),
      validDriverPhone(value) ? 't' : 'f',
      value,
    )
  }
})

test('required fields, UTF-16 limits and non-string inputs are validated on the database', async () => {
  for (const data of [
    { ...fields, customer: '   ' },
    { ...fields, cargo: 'x'.repeat(201) },
    { ...fields, cargo: '🚚'.repeat(101) },
    { ...fields, driver: 123 },
    { ...fields, notes: 'x'.repeat(2001) },
  ]) {
    await assert.rejects(create(actors.a, data), /22023/)
  }
  const created = await create(actors.a, {
    ...fields,
    cargo: '🚚'.repeat(100),
    invoice_number: 'اختياري',
  })
  assert.equal((await row(created.shipment_id))[0].invoice_number, 'اختياري')
})

test('private roles/receipts and administrator settings remain inaccessible to employees', async () => {
  for (const table of ['app_private.account_access', 'app_private.command_receipts']) {
    await assert.rejects(sql(`select * from ${table};`, actors.a), /42501/)
  }
  assert.equal(await sql('select count(*) from public.report_recipients;', actors.a), '0')
  assert.equal(await sql('select count(*) from public.admin_events;', actors.a), '0')
  assert.equal(
    await sql(
      `select count(*) from public.admin_events where actor_id = ${q(actors.admin)};`,
      actors.admin,
      admin,
    ),
    '1',
  )
})

test('writer and access-reader roles have no login, bypass, ownership, hard-delete or audit-edit privileges', async () => {
  assert.equal(
    await sql(
      "select count(*) from pg_roles where rolname in ('vs_command_writer','vs_access_reader') and (rolcanlogin or rolsuper or rolbypassrls or rolcreaterole or rolcreatedb);",
    ),
    '0',
  )
  assert.equal(
    await sql(
      "select count(*) from pg_tables where schemaname in ('public','app_private') and tableowner in ('vs_command_writer','vs_access_reader');",
    ),
    '0',
  )
  assert.equal(
    await sql(
      "select has_table_privilege('vs_command_writer','public.shipments','DELETE') or has_table_privilege('vs_command_writer','public.shipment_events','UPDATE') or has_table_privilege('vs_command_writer','public.shipment_events','DELETE');",
    ),
    'f',
  )
  assert.equal(
    await sql(
      "select has_function_privilege('anon','public.shipment_command(text,uuid,uuid,bigint,jsonb,timestamp with time zone)','EXECUTE');",
    ),
    'f',
  )
  assert.equal(
    await sql(
      "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and ((n.nspname='public' and c.relname in ('profiles','shipments','shipment_events','invoice_files','report_recipients','admin_events')) or n.nspname='app_private') and (not c.relrowsecurity or not c.relforcerowsecurity);",
    ),
    '0',
  )
})
