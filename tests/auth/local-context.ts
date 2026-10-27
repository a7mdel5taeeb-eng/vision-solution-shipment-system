import { execFileSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { validLocalApi } from '../../src/app/auth/config.ts'

/** Server-side test helper only. Never import this module from src/ or print its returned keys. */
export function localAuthContext() {
  if (process.env.DOCKER_HOST && !/^(npipe:|unix:)/.test(process.env.DOCKER_HOST))
    throw new Error('Local Auth fixtures refuse remote Docker endpoints')
  let status: Record<string, string>
  try {
    const endpoint = execFileSync(
      'docker',
      ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 },
    ).trim()
    if (!endpoint.startsWith('npipe:') && !endpoint.startsWith('unix:'))
      throw new Error('Remote engine')
    status = JSON.parse(
      execFileSync(
        process.execPath,
        ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 20000 },
      ),
    )
  } catch {
    throw new Error(
      'Existing local Supabase stack is required; no reset or bootstrap was attempted.',
    )
  }
  const url = status.API_URL ?? ''
  const publicKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY ?? ''
  const serviceKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY ?? ''
  if (!validLocalApi(url) || !publicKey || !serviceKey)
    throw new Error('Local Auth test configuration unavailable')
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { url: new URL(url).origin, publicKey, admin, jwtSecret: status.JWT_SECRET ?? '' }
}

export async function createFictionalFixture(
  context: ReturnType<typeof localAuthContext>,
  purpose: 'integration' | 'preview',
) {
  const email = `phase3c1-${purpose}-${randomUUID()}@example.invalid`
  const password = randomBytes(32).toString('base64url')
  const { data, error } = await context.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      local_fixture: 'phase3c1',
      ...(purpose === 'integration' ? { role: 'admin' } : {}),
    },
  })
  if (error || !data.user) throw new Error('Fictional local Auth fixture creation failed')
  // No profile/account_access rows, application role, invitations or email delivery.
  return { id: data.user.id, email, password }
}
