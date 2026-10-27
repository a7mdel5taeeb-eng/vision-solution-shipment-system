# Computer-switch checkpoint — 2026-10-27 (Asia/Riyadh)

## State saved for the home computer

This is a synchronization checkpoint, not a new development phase. Development stops after this document is committed, pushed and verified.

- Current branch: `feature/phase-3b-database-foundation`.
- Completed implementation commit: `3e3cd72ba47ca2699c951c225ec609396fdb0c6f`.
- Phase 3B [PR #5](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/5) is open, reviewable and **not merged**. Its implementation commit was verified on GitHub before this checkpoint.
- Stable `main`: `7fb40c9bfde944a6f7c3cee57da822a164801890`, the approved Phase 3A PR #4 merge. This checkpoint does not merge anything.
- Before creating this handoff document, the working tree and index were clean. No local stashes, additional worktrees, Phase 3C branches or Phase 3C changes were found after fetching all remote branches.
- **Phase 3C has not started in this repository.** There is no incomplete Phase 3C code to label as WIP or move to a new branch. Do not mistake this Phase 3B checkpoint for Phase 3C implementation or approval.
- All existing work remains preserved. No database reset, browser-data change, service installation, deployment or additional phase is part of saving this checkpoint.

The checkpoint commit contains this document only. Its own commit ID is provided in the delivery message; it cannot be embedded in its contents. On the other computer, compare `git rev-parse HEAD` with the checkpoint hash and current remote branch.

## Completed work

- Phase 3A architecture approved, merged and safely synchronized.
- Phase 3B local Supabase configuration, two PostgreSQL migrations and eight tables prepared.
- Protected roles/RLS, employee ownership, administrator MFA checks, restricted table/function grants, shipment commands, server numbering, revision conflict protection, audit history and idempotency implemented.
- Separate real-PostgreSQL integration suite and Windows setup/runbook committed.
- Supabase CLI `2.122.0` pinned in the development dependencies; Docker Desktop/WSL were installed and used on the current computer under authorization.
- Approved frontend, branding, Arabic/English support, Impeccable configuration and browser-local demo preserved.

See [Phase 3B runbook](phase-3b-database-foundation.md) for implementation details and security boundaries.

## Test status — historical evidence, not a new test run

The following were executed for implementation commit `3e3cd72ba47ca2699c951c225ec609396fdb0c6f` and documented in the runbook:

| Check                        | Last recorded result                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Frontend/domain tests        | 36/36 passed                                                                                                    |
| Database integration tests   | 20/20 passed against local PostgreSQL 17.11 with authenticated/anonymous database roles and identity/AAL claims |
| `npm run check`              | Formatting, lint, tests, TypeScript and production build passed                                                 |
| Supabase local database lint | No errors or warnings                                                                                           |
| Fresh migration replay       | Both migrations applied                                                                                         |
| Demo HTTP probe              | `/daily-report` responded with HTTP 200                                                                         |

These suites are **not rerun just to save this documentation checkpoint**. The checkpoint document receives formatting and diff checks. Re-run the full checks on the home computer to verify its environment. The earlier results do not certify that computer's Docker, Auth or browser setup.

Still unverified/outside the completed foundation: HTTP JWT validation and password sign-in, MFA enrollment/recovery, private Storage/file bytes, backups/restore, production performance and the browser-to-backend adapter. Database role/claim tests must not be described as end-to-end production authentication tests.

## What GitHub transfers

GitHub transfers committed source, migrations, lockfile, tests, project instructions, shared product/design context and this document. It does **not** transfer running processes, Docker installation/volumes, local PostgreSQL data, browser localStorage, credentials, environment files, generated Impeccable skill/hook files or machine consent.

No secret, environment file, database dump, Docker data or local operational export belongs in this checkpoint. No operational data transfer has been requested. Preserve any browser-local records on their current computer; do not silently seed, clear, copy or import them.

## Exact Windows resume steps

Prerequisites on the home computer: Git with access to the private repository, Node.js 22.12+ (24 LTS recommended), npm 10+, and Docker Desktop/WSL with the Linux engine running for database tests. Follow the Phase 3B runbook for machine setup; installing them on the current computer did not install them at home. Stop this project's existing Vite server before `npm ci` to avoid Windows native-file locks.

For a **new clone**, run:

```powershell
Set-Location $env:USERPROFILE
git clone https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system.git
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; stop here' }
```

If the destination folder already exists, use that checkout instead of cloning over it. The following assumes it is directly under the Windows user profile; adjust the folder if the existing checkout is elsewhere:

```powershell
Set-Location (Join-Path $env:USERPROFILE 'vision-solution-shipment-system')
git status --short --branch
if ($LASTEXITCODE -ne 0) { throw 'This is not the intended Git checkout' }
if (git status --porcelain) { throw 'Preserve and review existing local work before switching branches' }

git fetch origin --prune
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
git switch feature/phase-3b-database-foundation
if ($LASTEXITCODE -ne 0) { throw 'Branch switch failed; do not continue' }
git pull --ff-only origin feature/phase-3b-database-foundation
if ($LASTEXITCODE -ne 0) { throw 'Branches differ; preserve local commits and reconcile deliberately' }
git merge-base --is-ancestor 3e3cd72ba47ca2699c951c225ec609396fdb0c6f HEAD
if ($LASTEXITCODE -ne 0) { throw 'The verified Phase 3B implementation is missing' }
git rev-parse HEAD
git ls-remote --heads origin feature/phase-3b-database-foundation
git status --short --branch
```

Confirm the local and remote hashes match. On a new clone, Git normally creates the local tracking branch when `git switch` finds the uniquely matching `origin` branch. If it does not, inspect branches and use `git switch --track origin/feature/phase-3b-database-foundation`; never force a reset or overwrite.

Then install the committed dependencies, recreate the approved Impeccable tools and verify the local environment. Run these one at a time and stop if any fails:

```powershell
npm ci
.\scripts\setup-impeccable.ps1
.\scripts\setup-impeccable.ps1 -CheckOnly
npm run db:start
npx --no-install supabase migration up --local
npm run test:db
npm run check
npm run dev
```

The local migration command is for this dedicated development database only. Review any existing local database first and never reset it to resolve a startup/migration error without authorization. No cloud login, linked project, production credentials or paid resource is needed. Open/reopen this repository in Codex after Impeccable setup and review any machine-local hook trust prompt. The final `dev` command runs the unchanged browser-local application, not a database-connected production application.

## Resuming Phase 3C work

At home, open `AGENTS.md`, this checkpoint and the Phase 3B runbook. Ask Codex to verify the current GitHub state and review PR #5. **Phase 3B still requires explicit approval before merging.** Do not infer approval from this request to save progress.

There is currently no Phase 3C scope or dedicated branch to resume. Before writing Phase 3C code, obtain its approved requirements and starting base, then create its dedicated branch from the appropriate latest approved code. Do not create it during this handoff or build blindly on unapproved work. If a Phase 3C branch has appeared on GitHub since this checkpoint, inspect its ownership, history and instructions before selecting it; never replace it with a new branch of the same name.

Suggested first message in the home-computer Codex session:

> Read AGENTS.md and docs/computer-switch-checkpoint-2026-10-27.md. Fetch GitHub safely, verify the checkpoint branch and PR #5, preserve all local work, and report the actual phase/test state. Phase 3C was not started at this checkpoint. Wait for my Phase 3C scope and approval before implementation; do not merge, deploy, reset data or connect production services.

Remaining approvals include the Phase 3B review/merge, Phase 3C scope, production region/residency, retention, RPO/RTO and subscription. Auth/HTTP tests, account administration, private invoice storage and application integration remain future work, not incomplete features silently approved by switching computers.
