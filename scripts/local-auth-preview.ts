import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { localAuthContext, createFictionalFixture } from '../tests/auth/local-context.ts'

const path = 'local-data/auth-preview-account.local.json'
if (existsSync(path) || existsSync('.env.connected.local'))
  throw new Error(
    'Preview fixture/configuration already exists; preserve it rather than overwriting local files.',
  )
const context = localAuthContext()
const fixture = await createFictionalFixture(context, 'preview')
mkdirSync('local-data', { recursive: true })
writeFileSync(
  path,
  JSON.stringify(
    { ...fixture, purpose: 'Fictional local Auth fixture only; no application role or profile' },
    null,
    2,
  ),
  { flag: 'wx', mode: 0o600 },
)
writeFileSync(
  '.env.connected.local',
  `VITE_SUPABASE_URL=${context.url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${context.publicKey}\n`,
  { flag: 'wx', mode: 0o600 },
)
console.log(
  'Fictional local Auth fixture created. Credentials: local-data/auth-preview-account.local.json (ignored).',
)
console.log(
  'Only the public client key was written to ignored .env.connected.local. Start npm run dev:connected.',
)
