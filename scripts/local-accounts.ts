import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'
import { localAuthContext } from '../tests/auth/local-context.ts'
import { requireLocalDatabase, quote, sql } from '../tests/database/local-postgres.mjs'

// No arbitrary identity/role input and no browser-accessible provisioning endpoint.
const path = 'local-data/phase3c2-accounts.local.json'
if (existsSync(path))
  throw new Error('Local accounts already exist; preserve their credentials and factors')
const context = localAuthContext()
await requireLocalDatabase()
const accounts: Array<{
  label: string
  id: string
  email: string
  password: string
  role: 'admin' | 'employee'
}> = []
mkdirSync('local-data', { recursive: true })
writeFileSync(
  path,
  JSON.stringify({ purpose: 'Fictional local Phase 3C.2 accounts only', accounts }, null, 2),
  { flag: 'wx', mode: 0o600 },
)
for (const [label, role, name, nameAr] of [
  ['admin', 'admin', 'Fictional Local Administrator', 'مدير محلي تجريبي'],
  ['employeeA', 'employee', 'Fictional Employee A', 'موظف تجريبي أ'],
  ['employeeB', 'employee', 'Fictional Employee B', 'موظف تجريبي ب'],
] as const) {
  const email = `phase3c2-${label.toLowerCase()}-${randomUUID()}@example.invalid`
  const password = randomBytes(32).toString('base64url')
  const { data, error } = await context.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { local_fixture: 'phase3c2' },
  })
  if (error || !data.user)
    throw new Error('Local fictional account creation failed; existing accounts preserved')
  // Save credentials before SQL, so partial setup never silently loses an identity.
  accounts.push({ label, id: data.user.id, email, password, role })
  mkdirSync('local-data', { recursive: true })
  writeFileSync(
    path,
    JSON.stringify({ purpose: 'Fictional local Phase 3C.2 accounts only', accounts }, null, 2),
    { mode: 0o600 },
  )
  await sql(`insert into public.profiles(id,name,name_ar) values (${quote(data.user.id)},${quote(name)},${quote(nameAr)});
    insert into app_private.account_access(user_id,role,active) values (${quote(data.user.id)},${quote(role)},true);`)
}
console.log(
  'Three fictional local accounts provisioned through trusted Auth/SQL operator paths. Credentials remain in ignored local-data/phase3c2-accounts.local.json. Administrator must enroll TOTP; no recovery bypass was created.',
)
