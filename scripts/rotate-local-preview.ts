import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localAuthContext } from '../tests/auth/local-context.ts'

// Trusted Node-only operator action; never imported by React or given a VITE variable.
const path = 'local-data/auth-preview-account.local.json'
const fixture = JSON.parse(readFileSync(path, 'utf8'))
if (!/^phase3c1-preview-[a-f0-9-]+@example\.invalid$/.test(fixture.email))
  throw new Error('Only the existing fictional preview account may be rotated')
if (fixture.rotatedAt)
  throw new Error('Preview password already rotated; do not overwrite it again')
const context = localAuthContext()
const { data } = await context.admin.auth.admin.getUserById(fixture.id)
if (
  !data.user ||
  data.user.email !== fixture.email ||
  data.user.user_metadata.local_fixture !== 'phase3c1'
)
  throw new Error('Fictional identity guard failed')
const password = randomBytes(32).toString('base64url')
const update = await context.admin.auth.admin.updateUserById(fixture.id, { password })
if (update.error) throw new Error('Local fictional password rotation failed; values suppressed')
// Save the new credential immediately so a subsequent verification failure cannot lose it.
writeFileSync(
  path,
  JSON.stringify({ ...fixture, password, rotatedAt: new Date().toISOString() }, null, 2),
  { mode: 0o600 },
)
const client = createClient(context.url, context.publicKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const old = await client.auth.signInWithPassword({
  email: fixture.email,
  password: fixture.password,
})
if (!old.error) throw new Error('Old fictional credential was not rejected')
const fresh = await client.auth.signInWithPassword({ email: fixture.email, password })
if (fresh.error) throw new Error('Rotated fictional credential verification failed')
await context.admin.auth.admin.signOut(fresh.data.session!.access_token, 'global')
console.log(
  'Fictional preview password rotated; old rejected, new verified, refresh sessions revoked. Credential remains in the existing ignored local file.',
)
