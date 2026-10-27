# Vision & Solution — project status

Updated 27 October 2026, Asia/Riyadh. This document is the central session handoff. Update it whenever an approved development session concludes. Test results apply only to the named checkout and computer.

## Product and approved state

Premium Arabic/English shipment operations application for Vision & Solution / رؤى وحلول. React 19, TypeScript, Vite, Tailwind and browser-local demo persistence. The official company website and production services are separate and unchanged.

- **Approved frontend:** Phase 2.9. Official VS asset, local Cairo/Montserrat fonts, accessible form controls, bilingual/RTL support and separate role experiences are preserved.
- **Approved architecture:** Phase 3A, merged through PR #4. Stable `origin/main` checkpoint: `7fb40c9bfde944a6f7c3cee57da822a164801890`.
- **Phase 3B candidate:** database implementation `3e3cd72ba47ca2699c951c225ec609396fdb0c6f`; school checkpoint `f290bfe0ae47126da1d56d08d56ff50c1a59291d`; branch `feature/phase-3b-database-foundation`. Implemented and historically tested, but **not approved for merging**.
- **Current maintenance work:** `chore/cross-computer-development-workflow`, based on the stable main checkpoint. Workflow docs/scripts only; no Phase 3B migrations or dependency changes are included. Maintenance PR awaits review; record its link below once created.
- **Phase 3C:** not started, not scoped, and not authorized by environment setup.

## Features and boundaries

The browser-local frontend supports Admin/Employee selection; employees' own shipments; administrator-wide management; automatic numbering/start time; creation/editing; optional string driver phone; completion/reopening; strict greater-than-96-hour overdue status; soft deletion/restoration; history; reports/CSV/printing; daily preview; and local users/settings. No live email is sent.

The Phase 3B branch contains two PostgreSQL migrations, eight tables, protected roles/RLS, employee ownership, administrator AAL2 claims, restricted grants, transactional commands, immutable identity, server numbering, revision conflicts, idempotency receipts and audit history. It uses a separate dedicated local Supabase database and does not connect the frontend.

Real password authentication, HTTP JWT validation, MFA enrollment/recovery, account administration commands, private file storage, browser/backend adapter, email scheduling/delivery, backups/restore verification, production provisioning and deployment remain future work. Database claims/role tests are not end-to-end production authentication tests.

## GitHub and recovery checkpoint

Repository: [a7mdel5taeeb-eng/vision-solution-shipment-system](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system), private, default branch main.

| Pull request                                                                                                    | Status                                                           |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [#5 — Phase 3B database foundation](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/5) | Open; unmerged; explicit approval required                       |
| Workflow maintenance PR                                                                                         | To be created from the separate chore branch; no automatic merge |

The home Phase 3B checkout recovered the exact school checkpoint, local and remote `f290bfe0ae47126da1d56d08d56ff50c1a59291d`, with no local work overwritten. There were no stashes or extra worktrees before this maintenance checkout was created. The original desktop checkout remains on the Phase 3B branch; a separate managed worktree holds maintenance changes. Local main was intentionally not changed during recovery.

The last verified synchronization checkpoint is the school hash above. For the workflow commit that contains this file, use `git rev-parse HEAD` and compare `git ls-remote --heads origin <active-branch>`; a file cannot embed its own eventual commit hash. Record each **previous verified** checkpoint in the next session update and report the new hash externally after pushing.

School recovery instructions: [computer-switch checkpoint](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/blob/f290bfe0ae47126da1d56d08d56ff50c1a59291d/docs/computer-switch-checkpoint-2026-10-27.md). Database details: [Phase 3B runbook](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/blob/f290bfe0ae47126da1d56d08d56ff50c1a59291d/docs/phase-3b-database-foundation.md). They live on the unmerged database branch and are intentionally not copied into this maintenance tree.

## HOME environment and latest executed checks

| Component/check                   | Verified result on HOME, 27 October 2026                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows / CPU                     | Windows 11 Pro build 26300; firmware virtualization and SLAT reported available                                                                                                              |
| Git / Node / npm                  | Git 2.53.0.windows.2; Node 24.12.0; npm 11.6.2                                                                                                                                               |
| Private GitHub access             | Authenticated account a7mdel5taeeb-eng; repository read/push permission verified                                                                                                             |
| Phase 3B dependencies             | `npm ci` succeeded; audit reported zero vulnerabilities                                                                                                                                      |
| Supabase CLI                      | Project-local exact 2.122.0 installed and executed; no unrelated global CLI                                                                                                                  |
| Docker Desktop                    | Official signed installer succeeded; Desktop 4.97.0.244584                                                                                                                                   |
| Docker CLI / Compose              | 29.9.2 / 5.6.1 executed successfully                                                                                                                                                         |
| WSL                               | 3.0.3 installed; kernel 6.18.54.1-1; default version 2                                                                                                                                       |
| Windows prerequisite              | VirtualMachinePlatform enabled; installer reports restart required; no restart performed                                                                                                     |
| Linux Docker engine               | Not ready before restart; local desktop-linux endpoint exists but daemon info fails before reboot                                                                                            |
| Local PostgreSQL / migrations     | Not started or applied on HOME; blocked by Linux engine readiness. No database was reset                                                                                                     |
| HOME database suite               | `npm run test:db` executed but stopped at prerequisite check; **zero RLS tests executed**                                                                                                    |
| Impeccable                        | Pinned skill 4.8.0 / engine 0.1.18 installed with setup script; `-CheckOnly` passed                                                                                                          |
| Codex hooks                       | Project manifest and local consent created; configuration verified. Active hook execution after reopening Codex is not yet independently proven; approve any separate trust prompt yourself  |
| Frontend check, Phase 3B checkout | Fresh `npm run check` after installation passed: formatting, Oxlint, 36/36 tests, strict TypeScript and production build                                                                     |
| ESLint                            | Not configured; the committed lint command uses Oxlint. Do not introduce an unrelated linter for this task                                                                                   |
| Preview                           | `npm run dev -- --host 0.0.0.0` running persistently; loopback port 5173 returned HTTP 200                                                                                                   |
| Maintenance script tests          | 20 offline Windows PowerShell 5.1 integration cases passed; dirty/ignored-file preservation, divergence, commit/push authorization, credential checks and database-test enforcement verified |

The maintenance checkout also passed npm run check (formatting, Oxlint, 36/36 tests, TypeScript and build). It has no source, public asset, package lock, database or shared Impeccable changes relative to the stable base.

Earlier browser recovery checks verified the Arabic/English entry and dashboards, 32 administrator records versus Omar's 11 records, driver phone form, daily preview, and employee rejection from administrator reports. No shipment records were changed. Browser data was not cleared or transferred.

**School-only historical evidence:** Phase 3B runbook records 20/20 real PostgreSQL integration tests on PostgreSQL 17.11, both migrations replayed, and no local database lint warnings. These are not new HOME results and do not certify the HOME database.

## Outstanding tasks / known issues

1. Finish and verify this maintenance PR without merging PR #5 or main automatically.
2. Obtain approval for a Windows restart; save work first. WSL cannot start its Linux VM until Windows activates the newly enabled feature. Do not bypass this restriction or restart without approval.
3. Complete Docker first-run setup; the installer did not auto-accept its subscription agreement. The user must approve any agreement/trust prompts. Verify local Linux engine/context and inspect existing project containers/volumes before starting Supabase.
4. On the Phase 3B checkout, start the dedicated local stack, inspect migration state, safely apply only pending committed migrations, run `npm run test:db`, and run local database lint. Never reset or delete volumes to resolve errors.
5. Update this status with actual HOME migration/database results, not the earlier school outcomes. Review PR #5 separately; merge requires explicit approval.
6. Review/approve the workflow PR before integrating its shared files into other active branches. Until then, the scripts/status file are available only on this maintenance branch; use the documented manual recovery steps on Phase 3B. Do not merge unapproved database code to obtain workflow files.
7. After foundation verification/review, obtain Phase 3C requirements and starting base. Region/residency, retention, RPO/RTO, account recovery, storage and budget decisions remain open.

## Daily continuity

Follow [HOME/SCHOOL workflow](cross-computer-workflow.md). Start by reading status and synchronizing the approved tracked branch safely. End by testing, updating status, reviewing explicit files and outgoing commits, making an authorized commit/push, and verifying the remote hash. Report the final branch, hash and PR to the user.

GitHub transfers source, docs, migrations, lockfiles and shared configuration. It does **not** transfer local installations, Docker volumes, database data, browser localStorage, secrets, running processes, local hook trust, or Codex conversations. Never use Git as a data/secret export mechanism.
