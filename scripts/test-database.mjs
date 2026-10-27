import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { requireLocalDatabase } from '../tests/database/local-postgres.mjs'

try {
  await requireLocalDatabase()
  const testFile = fileURLToPath(new URL('../tests/database/foundation.test.mjs', import.meta.url))
  const child = spawn(process.execPath, ['--experimental-strip-types', '--test', testFile], {
    stdio: 'inherit',
  })
  process.exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => resolve(code ?? 1))
  })
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
