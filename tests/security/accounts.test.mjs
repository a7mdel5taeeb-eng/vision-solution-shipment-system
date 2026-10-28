import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomBytes, randomUUID, sign } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localAuthContext, localSigningKey } from '../auth/local-context.ts'
import { requireLocalDatabase, sql as runSql, quote as q } from '../database/local-postgres.mjs'
import { totp } from './totp.ts'

let context
const people = {}
let ownA, ownB, factor, secret
const cleanupIds = []
const clients = []
const sql = (statement, ...args) => runSql(statement + ';', ...args)
const fields = {
  customer: 'Fictional HTTP customer',
  origin: 'الرياض',
  destination: 'Jeddah',
  truck: 'LOCAL-HTTP',
  driver: 'Fictional HTTP driver',
  cargo: 'Test cargo',
}
function client() {
  const value = createClient(context.url, context.publicKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  clients.push(value)
  return value
}
async function http(path, token, method = 'GET', body) {
  const response = await fetch(`${context.url}/rest/v1/${path}`, {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    headers: {
      apikey: context.publicKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}
const token = async (person) => (await person.client.auth.getSession()).data.session.access_token
const self = async (person) => http('rpc/get_my_account', await token(person), 'POST', {})
const list = async (person, id) =>
  http(`rpc/get_shipments`, await token(person), 'POST', { p_id: id })
async function command(
  person,
  operation,
  id = null,
  revision = null,
  data = {},
  requestId = randomUUID(),
) {
  return http('rpc/shipment_command', await token(person), 'POST', {
    p_operation: operation,
    p_request_id: requestId,
    p_shipment_id: id,
    p_expected_revision: revision,
    p_fields: data,
  })
}

before(async () => {
  context = localAuthContext()
  await requireLocalDatabase()
  assert.equal(
    await sql(
      "select count(*) from supabase_migrations.schema_migrations where version='20261028020000'",
    ),
    '1',
    'New self-account migration is required',
  )
  assert.equal(
    await sql(
      "select count(*) from supabase_migrations.schema_migrations where version='20261028060000'",
    ),
    '1',
    'Forward-only HTTP 404 mapping migration is required',
  )
  for (const [label, role, active] of [
    ['a', 'employee', true],
    ['b', 'employee', true],
    ['admin', 'admin', true],
    ['inactive', 'employee', false],
    ['orphan', null, false],
  ]) {
    const email = `phase3c2-http-${randomUUID()}@example.invalid`
    const password = randomBytes(32).toString('base64url')
    const created = await context.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { local_fixture: 'phase3c2-http', role: 'admin' },
    })
    if (created.error) throw new Error('Fictional HTTP fixture setup failed')
    const id = created.data.user.id
    cleanupIds.push(id)
    if (role)
      await sql(
        `insert into public.profiles(id,name,name_ar) values (${q(id)},'Fictional HTTP ${label}','حساب اختبار وهمي'); insert into app_private.account_access(user_id,role,active) values (${q(id)},${q(role)},${active});`,
      )
    const selected = client()
    const login = await selected.auth.signInWithPassword({ email, password })
    if (login.error) throw new Error('Real fixture password login failed')
    people[label] = { id, email, password, client: selected }
  }
  // Exercise existing backend commands only as security fixtures; no React adapter exists.
  const a = await command(people.a, 'create', null, null, fields)
  const b = await command(people.b, 'create', null, null, fields)
  assert.equal(a.status, 200, 'Employee A fixture command must succeed')
  assert.equal(b.status, 200, 'Employee B fixture command must succeed')
  ownA = a.body.shipment_id
  ownB = b.body.shipment_id
  await sql(
    `insert into public.invoice_files(shipment_id,object_key,uploaded_by) values (${q(ownB)},${q(randomUUID())},${q(people.b.id)});`,
  )
})
after(async () => {
  if (!cleanupIds.length) return
  const ids = cleanupIds.map(q).join(',')
  await sql(`delete from public.invoice_files where uploaded_by in (${ids});
    delete from public.shipment_events where shipment_id in (select id from public.shipments where owner_id in (${ids}));
    delete from app_private.command_receipts where actor_id in (${ids});
    delete from public.shipments where owner_id in (${ids});
    delete from app_private.account_access where user_id in (${ids});
    delete from public.profiles where id in (${ids});`)
  for (const id of cleanupIds) {
    const result = await context.admin.auth.admin.deleteUser(id)
    if (result.error) throw new Error('Own fictional HTTP fixture cleanup failed')
  }
  for (const selected of clients) await selected.auth.stopAutoRefresh()
})

test('self lookup uses protected roles and cannot be parameterized to inspect another user', async () => {
  const result = await self(people.a)
  assert.equal(result.status, 200)
  assert.equal(result.body.user_id, people.a.id)
  assert.equal(result.body.role, 'employee')
  assert.equal(result.body.can_operate, true)
  assert.equal(
    (await http('rpc/get_my_account', await token(people.a), 'POST', { user_id: people.b.id }))
      .status,
    404,
  )
  const other = await http(`profiles?select=id,name&id=eq.${people.b.id}`, await token(people.a))
  assert.deepEqual(other.body, [])
})
test('anonymous and missing tokens cannot execute self lookup or commands', async () => {
  for (const path of ['rpc/get_my_account', 'rpc/get_shipments']) {
    const result = await http(path, null, 'POST', {})
    assert.ok([401, 403].includes(result.status))
  }
})
test('employee A/B signed tokens isolate shipments, guessed IDs, history and invoice metadata', async () => {
  assert.equal((await list(people.a, ownA)).body.length, 1)
  assert.deepEqual((await list(people.a, ownB)).body, [])
  assert.deepEqual((await list(people.b, ownA)).body, [])
  assert.deepEqual(
    (await http(`shipments?select=id&id=eq.${ownB}`, await token(people.a))).body,
    [],
  )
  assert.deepEqual(
    (await http(`shipment_events?select=id&shipment_id=eq.${ownB}`, await token(people.a))).body,
    [],
  )
  const history = await http('rpc/get_shipment_history', await token(people.a), 'POST', {
    p_shipment_id: ownB,
  })
  assert.deepEqual(history.body, [])
  assert.deepEqual(
    (await http(`invoice_files?select=id&shipment_id=eq.${ownB}`, await token(people.a))).body,
    [],
  )
})
test('forged admin metadata in a genuinely signed JWT cannot change the protected employee role', async () => {
  const update = await people.a.client.auth.updateUser({
    data: { role: 'admin', aal: 'aal2', active: true },
  })
  assert.equal(update.error, null)
  await people.a.client.auth.refreshSession()
  assert.equal((await self(people.a)).body.role, 'employee')
  assert.deepEqual((await list(people.a, ownB)).body, [])
})
test('missing application account and inactive account fail closed without exposing profile or role', async () => {
  assert.deepEqual((await self(people.orphan)).body, { state: 'unprovisioned' })
  await sql(
    `insert into public.profiles(id,name) values (${q(people.orphan.id)},'Fictional profile without access');`,
  )
  assert.deepEqual((await self(people.orphan)).body, { state: 'unprovisioned' })
  assert.deepEqual((await self(people.inactive)).body, { state: 'inactive' })
  for (const p of [people.orphan, people.inactive]) {
    assert.deepEqual((await http('shipments?select=id', await token(p))).body, [])
    assert.equal((await command(p, 'create', null, null, fields)).status, 403)
  }
})
test('live deactivation revokes backend access with an already issued signed token', async () => {
  const issued = await token(people.a)
  try {
    await sql(`update app_private.account_access set active=false where user_id=${q(people.a.id)};`)
    assert.deepEqual((await http('rpc/get_my_account', issued, 'POST', {})).body, {
      state: 'inactive',
    })
    assert.equal((await http('rpc/get_shipments', issued, 'POST', { p_id: ownA })).status, 403)
    assert.equal((await command(people.a, 'update', ownA, '1', { customer: 'Denied' })).status, 403)
  } finally {
    await sql(`update app_private.account_access set active=true where user_id=${q(people.a.id)};`)
  }
})
test('administrator AAL1 may read only self onboarding, with no operational visibility or commands', async () => {
  const me = await self(people.admin)
  assert.equal(me.body.role, 'admin')
  assert.equal(me.body.aal, 'aal1')
  assert.equal(me.body.can_operate, false)
  assert.deepEqual((await http('shipments?select=id', await token(people.admin))).body, [])
  assert.deepEqual((await http('profiles?select=id', await token(people.admin))).body, [])
  assert.equal((await list(people.admin, ownA)).status, 403)
  assert.equal((await command(people.admin, 'create', null, null, fields)).status, 403)
})
test('TOTP enrollment cannot raise assurance until a real correct verification code succeeds', async () => {
  const enrolled = await people.admin.client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Fictional HTTP test',
  })
  assert.equal(enrolled.error, null)
  factor = enrolled.data.id
  secret = enrolled.data.totp.secret
  const foreignChallenge = await people.a.client.auth.mfa.challenge({ factorId: factor })
  assert.ok(
    foreignChallenge.error,
    'Another signed-in identity cannot challenge the administrator factor',
  )
  const pending = await people.admin.client.auth.mfa.listFactors()
  assert.ok(pending.data.all.some((f) => f.id === factor && f.status === 'unverified'))
  assert.equal(
    pending.data.totp.some((f) => f.id === factor),
    false,
    'SDK typed TOTP list contains verified factors only; onboarding must use all',
  )
  assert.equal((await self(people.admin)).body.aal, 'aal1')
  const valid = totp(secret)
  const wrong = valid.slice(0, 5) + String((Number(valid[5]) + 1) % 10)
  const denied = await people.admin.client.auth.mfa.challengeAndVerify({
    factorId: factor,
    code: wrong,
  })
  assert.ok(denied.error)
  assert.equal((await self(people.admin)).body.can_operate, false)
  const accepted = await people.admin.client.auth.mfa.challengeAndVerify({
    factorId: factor,
    code: totp(secret),
  })
  assert.equal(accepted.error, null)
  const me = await self(people.admin)
  assert.equal(me.body.aal, 'aal2')
  assert.equal(me.body.can_operate, true)
})
test('administrator access to both employees is granted only after real TOTP AAL2', async () => {
  assert.equal((await list(people.admin, ownA)).body.length, 1)
  assert.equal((await list(people.admin, ownB)).body.length, 1)
  // A fresh password-only login cannot inherit the administrator’s prior AAL2.
  const selected = client()
  const signedIn = await selected.auth.signInWithPassword({
    email: people.admin.email,
    password: people.admin.password,
  })
  assert.equal(signedIn.error, null)
  const fresh = { client: selected }
  assert.equal((await self(fresh)).body.aal, 'aal1')
  assert.equal((await self(fresh)).body.can_operate, false)
  assert.equal((await list(fresh, ownA)).status, 403)
  const listed = await selected.auth.mfa.listFactors()
  assert.equal(listed.data.totp.filter((f) => f.status === 'verified').length, 1)
  try {
    await sql(
      `update app_private.account_access set active=false where user_id=${q(people.admin.id)};`,
    )
    assert.deepEqual((await self(people.admin)).body, { state: 'inactive' })
    assert.equal(
      (await list(people.admin, ownA)).status,
      403,
      'Even a genuine AAL2 token cannot bypass inactive access',
    )
    assert.equal((await command(people.admin, 'create', null, null, fields)).status, 403)
  } finally {
    await sql(
      `update app_private.account_access set active=true where user_id=${q(people.admin.id)};`,
    )
  }
})
test('direct table writes, role assignment, protected schema and audit changes are denied including to MFA admin', async () => {
  for (const p of [people.a, people.admin]) {
    const jwt = await token(p)
    for (const [path, method, body] of [
      [`profiles?id=eq.${p.id}`, 'PATCH', { name: 'Denied' }],
      [`shipments?id=eq.${ownA}`, 'PATCH', { customer: 'Denied' }],
      [`shipments?id=eq.${ownA}`, 'DELETE', undefined],
      ['shipment_events', 'POST', { action: 'created' }],
      ['account_access', 'POST', { user_id: p.id, role: 'admin', active: true }],
    ])
      assert.ok(
        [401, 403, 404].includes((await http(path, jwt, method, body)).status),
        `Direct ${method} ${path.split('?')[0]} must be denied`,
      )
  }
})
test('cross-owner edits and employee delete/restore leave shipment, history and receipts unchanged', async () => {
  const baseline = await sql(
    `select md5(string_agg(to_jsonb(t)::text,'' order by id)) from public.shipment_events t where shipment_id=${q(ownB)};`,
  )
  const receiptCount = await sql(
    `select count(*) from app_private.command_receipts where actor_id=${q(people.a.id)};`,
  )
  const crossOwner = await command(people.a, 'update', ownB, '1', { ...fields, customer: 'Denied' })
  const absent = await command(people.a, 'update', randomUUID(), '1', {
    ...fields,
    customer: 'Denied',
  })
  // HTTP 404 is intentional: invisible and nonexistent records must be indistinguishable,
  // and failed commands must have no audit, shipment or idempotency side effects.
  assert.equal(crossOwner.status, 404)
  assert.equal(crossOwner.body.code, 'PT404')
  assert.equal(crossOwner.body.message, 'record_unavailable')
  assert.deepEqual(crossOwner, absent)
  const malformed = await command(people.a, 'update', 'not-a-uuid', '1', fields)
  assert.equal(malformed.status, 400, 'Malformed input remains a validation error, not not-found')
  assert.equal((await command(people.a, 'delete', ownA, '1')).status, 403)
  assert.equal((await command(people.a, 'restore', ownA, '1')).status, 403)
  assert.equal(
    await sql(
      `select md5(string_agg(to_jsonb(t)::text,'' order by id)) from public.shipment_events t where shipment_id=${q(ownB)};`,
    ),
    baseline,
  )
  assert.equal(
    await sql(
      `select count(*) from app_private.command_receipts where actor_id=${q(people.a.id)};`,
    ),
    receiptCount,
  )
  assert.equal((await list(people.b, ownB)).body[0].customer, fields.customer)
})

test('cached request replay after soft deletion returns the same HTTP 404 without side effects', async () => {
  const requestId = randomUUID()
  const created = await command(people.a, 'create', null, null, fields, requestId)
  assert.equal(created.status, 200)
  const replay = await command(people.a, 'create', null, null, fields, requestId)
  assert.deepEqual(replay, created, 'Authorized idempotent replay remains unchanged')
  const id = created.body.shipment_id
  const deleted = await command(people.admin, 'delete', id, created.body.revision)
  assert.equal(deleted.status, 200)
  const fingerprint = () =>
    sql(`select md5(jsonb_build_object(
    'shipment',(select to_jsonb(s) from public.shipments s where id=${q(id)}),
    'events',(select jsonb_agg(to_jsonb(e) order by id) from public.shipment_events e where shipment_id=${q(id)}),
    'receipts',(select jsonb_agg(to_jsonb(r) order by id) from app_private.command_receipts r where shipment_id=${q(id)})
  )::text);`)
  const before = await fingerprint()
  const unavailable = await command(people.a, 'create', null, null, fields, requestId)
  const absent = await command(people.a, 'update', randomUUID(), '1', fields)
  assert.equal(unavailable.status, 404)
  assert.equal(unavailable.body.code, 'PT404')
  assert.equal(unavailable.body.message, 'record_unavailable')
  assert.deepEqual(
    unavailable,
    absent,
    'A cached inaccessible record must not reveal its existence',
  )
  assert.equal(
    await fingerprint(),
    before,
    'Denied replay must not alter record, audit or receipts',
  )
})
test('tampered AAL/admin claims and expired correctly signed tokens fail at the actual HTTP JWT boundary', async () => {
  const jwt = await token(people.a)
  const [header, encoded] = jwt.split('.')
  const original = JSON.parse(Buffer.from(encoded, 'base64url'))
  const forged = `${header}.${Buffer.from(JSON.stringify({ ...original, aal: 'aal2', role: 'service_role' })).toString('base64url')}.${jwt.split('.')[2]}`
  assert.equal((await http('rpc/get_my_account', forged, 'POST', {})).status, 401)
  const decoded = JSON.parse(Buffer.from(header, 'base64url'))
  function signed(payload) {
    const content = `${header}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`
    const signature =
      decoded.alg === 'ES256'
        ? sign('sha256', Buffer.from(content), {
            key: localSigningKey(decoded.kid),
            dsaEncoding: 'ieee-p1363',
          }).toString('base64url')
        : createHmac('sha256', context.jwtSecret).update(content).digest('base64url')
    return `${content}.${signature}`
  }
  assert.equal(
    (await http('rpc/get_my_account', signed(original), 'POST', {})).status,
    200,
    'Control signer must be accepted',
  )
  assert.equal(
    (
      await http(
        'rpc/get_my_account',
        signed({ ...original, exp: Math.floor(Date.now() / 1000) - 120 }),
        'POST',
        {},
      )
    ).status,
    401,
  )
})
test('new self-reader role has no login, bypass, table ownership, writes or PUBLIC execution', async () => {
  assert.equal(
    await sql(
      "select count(*) from pg_roles where rolname='vs_self_reader' and not rolcanlogin and not rolbypassrls and not rolsuper",
    ),
    '1',
  )
  assert.equal(
    await sql(
      "select has_function_privilege('anon','public.get_my_account()','execute') or has_function_privilege('service_role','public.get_my_account()','execute')",
    ),
    'f',
  )
  assert.equal(
    await sql(
      "select has_table_privilege('vs_self_reader','public.shipments','select') or has_table_privilege('vs_self_reader','public.profiles','update')",
    ),
    'f',
  )
})

test('HTTP mapping migration keeps command owner and narrowly granted execute rights', async () => {
  const signature = 'public.shipment_command(text,uuid,uuid,bigint,jsonb,timestamptz)'
  assert.equal(
    await sql(
      `select pg_get_userbyid(proowner) from pg_proc where oid='${signature}'::regprocedure;`,
    ),
    'vs_command_writer',
  )
  assert.equal(
    await sql(
      `select has_function_privilege('anon','${signature}','execute') or has_function_privilege('service_role','${signature}','execute');`,
    ),
    'f',
  )
  assert.equal(
    await sql(`select has_function_privilege('authenticated','${signature}','execute');`),
    't',
  )
})
