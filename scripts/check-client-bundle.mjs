import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'dist'
if (!existsSync(root)) throw new Error('Build directory does not exist; build before scanning.')
const privateValues = []
function collect(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, entry] of Object.entries(value)) {
    if (/password|secret/i.test(key) && typeof entry === 'string' && entry.length >= 6)
      privateValues.push(entry)
    else collect(entry)
  }
}
if (existsSync('local-data')) {
  for (const file of readdirSync('local-data', { withFileTypes: true })) {
    if (file.isFile() && file.name.endsWith('.json'))
      collect(JSON.parse(readFileSync(join('local-data', file.name), 'utf8')))
  }
}
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
      privateValues.some((secret) => value.includes(secret))
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
  `Browser credential scan passed: ${count} files in ${root}; no private keys, non-public JWTs or local fixture credentials.`,
)
