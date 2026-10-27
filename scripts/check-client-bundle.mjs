import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'dist'
if (!existsSync(root)) throw new Error('Build directory does not exist; build before scanning.')
let fixturePassword = ''
if (existsSync('local-data/auth-preview-account.local.json'))
  fixturePassword = JSON.parse(
    readFileSync('local-data/auth-preview-account.local.json', 'utf8'),
  ).password
let count = 0
function scan(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name)
    if (entry.isDirectory()) {
      scan(file)
      continue
    }
    if (!/\.(js|html|css|json|map)$/.test(entry.name)) continue
    count++
    const value = readFileSync(file, 'utf8')
    if (
      /sb_secret_[A-Za-z0-9_-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
        value,
      ) ||
      (fixturePassword && value.includes(fixturePassword))
    )
      throw new Error(`Private credential marker found in ${file}; values suppressed.`)
    for (const match of value.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      let role
      try {
        role = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url')).role
      } catch {
        continue
      }
      if (role !== 'anon') throw new Error(`Non-public JWT found in ${file}; token suppressed.`)
    }
  }
}
scan(root)
console.log(
  `Browser credential scan passed: ${count} files in ${root}; no private keys, non-public JWTs or local fixture password.`,
)
