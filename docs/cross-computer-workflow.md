# HOME ↔ GitHub ↔ SCHOOL workflow

GitHub is the source of truth for committed code and documentation. Use the same process on either Windows computer. This workflow does not approve a new phase, a merge, a deployment or a database reset.

## First setup on a computer

Clone the private application repository only if there is no suitable existing checkout. Never clone over an existing folder. Verify GitHub authentication with `gh auth status` or Git Credential Manager. Use Git, Node 22.12+ (24 LTS preferred) and npm 10+.

Read `AGENTS.md`, `docs/PROJECT_STATUS.md`, and the active branch's checkpoint/runbook. Fetch and inspect before choosing the approved branch. Node dependencies, pinned Impeccable files and hook consent are machine-local. Use `npm ci` and `./scripts/setup-impeccable.ps1`, then `./scripts/setup-impeccable.ps1 -CheckOnly`. Respect the toolchain pin; never silently upgrade. On Windows, arrange an authorized stop/restart of this project's Vite process before `npm ci` to avoid native file locks.

Docker Desktop with a working Linux engine and WSL 2 is required only for the database branch's integration tests. Supabase is an exact project development dependency on that branch; use its lockfile rather than a global installation. Install system prerequisites through official sources with authorization for elevation, Windows feature changes and restarts. Complete any license or separate Codex hook-trust prompt personally. Do not bypass execution policy or security controls; request the appropriate machine policy approval if scripts are blocked.

## Start every session

From the checkout that contains the reviewed workflow:

```powershell
Get-Content docs/PROJECT_STATUS.md
git status --short --branch
./scripts/sync-start.ps1
```

The script verifies the exact application origin, branch and upstream; displays status, stashes and worktrees; rejects local changes and unfinished Git operations; fetches origin; and only fast-forwards an approved tracked development branch. It protects ignored local files too. It never automatically switches branches, stashes work, pushes, writes main, resets or merges divergent histories. Ahead-only commits are preserved with a warning. Decide the approved task after reading the refreshed status and checkpoint.

If synchronization stops, preserve the work and inspect it. Do not run reset/clean, force a checkout or automatically stash. A branch without tracking requires deliberate selection of its matching origin branch. Main updates and feature merges require separate approval. When a branch switch is needed, first verify a clean tree and use `git switch --no-overwrite-ignore <approved-branch>`; review ignored-file collisions rather than overwriting them.

Until this maintenance PR is reviewed and integrated, the Phase 3B branch does not contain these new scripts/status files. Do not copy database code into the maintenance branch or merge PR #5 to get workflow tooling. Use the school checkpoint's manual Git inspection/fetch/safe-switch/fast-forward steps on Phase 3B, then integrate reviewed workflow files later under explicit approval. Read tools/scripts from the checkout they belong to; they target their own repository root.

## End every approved session

Update `docs/PROJECT_STATUS.md` with the approved task, implemented versus pending features, exact branch, PR links, actual test commands/results, environment blockers, and previous verified synchronization checkpoint. The new commit cannot contain its own eventual hash: report that hash after push and record it in the following status update.

Review `git diff`, `git diff --check`, each selected file, and all outgoing commits. Exclude real business records, credentials, environment files, machine settings, generated hooks, binaries, builds and exports. The script's pattern scan is a guard, not proof that arbitrary files contain no sensitive information. Review manually before passing approval switches.

For a clean tree with existing reviewed commits, check without uploading:

```powershell
./scripts/sync-end.ps1 -StatusReviewed
```

To commit only named, approved files and push after the user has authorized both actions, use an array in Windows PowerShell:

```powershell
$approvedFiles = @('docs/PROJECT_STATUS.md', 'src/features/example/ApprovedChange.tsx')
./scripts/sync-end.ps1 -Files $approvedFiles `
  -CommitMessage 'Describe the approved change' `
  -StatusReviewed -ConfirmReviewed -AuthorizeCommit -AuthorizePush
```

Replace the example file with actual reviewed paths. No folders, wildcards, unrelated pending changes or pre-staged files are accepted. Passing flags records the human's authorization; it does not authorize an agent to decide to upload. Without `-AuthorizePush`, nothing is uploaded. Without `-AuthorizeCommit`, the tree must already be clean and no commit is created. The script never writes main/master.

Every end check runs `npm run check`, including formatting, Oxlint, application tests, TypeScript and production build. A branch containing `supabase/migrations` also requires `-IncludeDatabaseTests`; its local engine/migrations must already be ready. The script does not start, migrate or reset databases. A failed check stops publication. New development branches may be published only if no conflicting origin branch exists. Existing branches require matching tracking and no remote-ahead/diverged history.

After a normal, non-forced push, the script compares `HEAD` with the exact remote branch hash. Only a match produces `VERIFIED`. A concurrent push is rejected by Git. Report branch, full hash and PR URL; do not claim backup success from a local commit or push attempt alone. PR creation/review is separate; never automatically merge.

## Database verification after the HOME restart

Work only on `feature/phase-3b-database-foundation`, currently checkpoint `f290bfe0ae47126da1d56d08d56ff50c1a59291d`. Read its runbook. Verify Docker's context endpoint is local (`npipe:`/`unix:`) and its OS is Linux. Inspect existing containers and volumes; identify `supabase_db_vision-solution-local` and the dedicated `vision-solution-local` configuration, ports 54321/54322. Do not print or commit local keys.

After verifying any existing project database and preserving its data:

```powershell
npm run db:start
npx --no-install supabase migration list --local
npx --no-install supabase migration up --local
npm run test:db
npx --no-install supabase db lint --local --level warning
npm run check
npm run dev -- --host 0.0.0.0
```

Do not start a second preview if port 5173 already belongs to this project. On a fresh project, start may already apply both migrations; confirm their recorded versions before applying pending migrations. On an existing database, inspect first and stop on conflicts rather than resetting. Never run hosted `login`, `link`, `db push`, reset, volume removal or operational imports. Database tests create fictional isolated fixtures and clean up only their own records. They do not prove production Auth/JWT/MFA or Storage behavior.

## Offline script verification

```powershell
powershell.exe -NoProfile -File scripts/test-sync-workflow.ps1
```

The harness uses new disposable bare repositories and Windows PowerShell 5.1. It substitutes only the repository identity in fixture copies so no GitHub network is used. It tests clean/ahead/behind/divergent states, dirty and ignored-file preservation, sensitive content, explicit file selection, staged-work preservation, main protection, authorized commits, no implicit upload and verified authorized local pushes. Fixtures are preserved under ignored `artifacts/sync-tests/`; they contain fictional data only.

## What does not move through GitHub

Docker volumes and PostgreSQL data, browser localStorage, environment secrets, local tool installations, generated Impeccable files/hook consent, running development servers and Codex conversation history remain on their own computer. A clone is not a database backup. Do not export, overwrite, seed, reset or delete operational data as part of switching computers.

Finish by reporting readiness and remaining approvals. Phase 3B and this maintenance PR must be reviewed independently. Phase 3C remains stopped until explicitly scoped and approved.
