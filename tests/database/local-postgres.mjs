import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
export const container = 'supabase_db_vision-solution-local'
let docker = 'docker'

export async function requireLocalDatabase() {
  if (process.env.DOCKER_HOST && !/^(npipe:|unix:)/.test(process.env.DOCKER_HOST)) {
    throw new Error('Database tests refuse a remote DOCKER_HOST; use the local Docker engine.')
  }
  if (process.platform === 'win32') {
    const candidates = [
      join(
        process.env.ProgramFiles ?? 'C:\\Program Files',
        'Docker',
        'Docker',
        'resources',
        'bin',
        'docker.exe',
      ),
      join(
        process.env.LOCALAPPDATA ?? '',
        'Programs',
        'DockerDesktop',
        'resources',
        'bin',
        'docker.exe',
      ),
    ]
    for (const candidate of candidates) {
      if (
        await access(candidate).then(
          () => true,
          () => false,
        )
      ) {
        docker = candidate
        break
      }
    }
  }
  try {
    const { stdout } = await execute(
      docker,
      ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
      { timeout: 15000 },
    )
    if (!/^(npipe:|unix:)/.test(stdout.trim()))
      throw new Error('Remote Docker contexts are not allowed.')
    await execute(docker, ['inspect', container, '--format', '{{.State.Running}}'], {
      timeout: 15000,
    }).then(({ stdout }) => {
      if (stdout.trim() !== 'true') throw new Error('Local database container is stopped.')
    })
    const version = await sql(
      "select count(*) from supabase_migrations.schema_migrations where version in ('20261027091000','20261027091100');",
    )
    if (version !== '2') throw new Error('Phase 3B migrations have not both been applied.')
  } catch (error) {
    throw new Error(
      `Local PostgreSQL prerequisite failed. Start Docker Desktop, then run npm run db:start. No RLS tests executed. ${error.message}`,
    )
  }
}

export function quote(value) {
  return value === null ? 'null' : `'${String(value).replaceAll("'", "''")}'`
}

export async function sql(
  statement,
  actor,
  { aal = 'aal1', role = 'authenticated', metadata = {} } = {},
) {
  const claims = JSON.stringify({ sub: actor, role, aal, user_metadata: metadata })
  const identity = actor
    ? `set local role ${role === 'anon' ? 'anon' : 'authenticated'}; set local request.jwt.claims = ${quote(claims)};`
    : ''
  const input = `begin; set local statement_timeout = '8s'; set local lock_timeout = '6s'; ${identity}\n${statement}\ncommit;`
  return new Promise((resolve, reject) => {
    const child = execFile(
      docker,
      [
        'exec',
        '-i',
        container,
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-v',
        'VERBOSITY=verbose',
      ],
      { timeout: 30000, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) reject(new Error(stderr.trim() || error.message))
        else resolve(stdout.trim())
      },
    )
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

export async function json(statement, actor, options) {
  return JSON.parse(await sql(statement, actor, options))
}
