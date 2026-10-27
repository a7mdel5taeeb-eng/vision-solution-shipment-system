# Phase 3B — final HOME verification

Executed 27 October 2026, Asia/Riyadh. These are fresh HOME results from this verification, not the historical school outcomes.

## Checkouts and scope

- Application/database: desktop checkout, `feature/phase-3b-database-foundation`, `f290bfe0ae47126da1d56d08d56ff50c1a59291d`; clean and 0 ahead/0 behind origin after fetch.
- Documentation/workflow: managed worktree, `chore/cross-computer-development-workflow`, verified prior checkpoint `ae830ae02ed744b6a3cc00f7529045cbf7cc91bf`; clean and synchronized before recording this report.
- No database reset, service recreation, pending migration application, frontend change, production connection, merge or Phase 3C implementation was needed. Tests created and removed only their own fictional fixtures in the dedicated local database.

## Live database and service checks

Docker Desktop reports running. The context endpoint is the local named pipe and the engine OS is Linux. Required services:

| Container suffix: vision-solution-local | Result                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- |
| supabase_db                             | Running, Docker healthy; pg_isready accepts connections                |
| supabase_auth                           | Running, Docker healthy; local Auth health HTTP 200                    |
| supabase_kong                           | Running, Docker healthy                                                |
| supabase_rest                           | Running; no Docker health check configured; gateway REST root HTTP 200 |

PostgreSQL is **17.11**. The committed and applied migration lists match: `20261027091000` and `20261027091100`. No migration was reapplied or database recreated.

| Expected table               | RLS enabled | RLS forced | Policies |
| ---------------------------- | ----------- | ---------- | -------- |
| public.profiles              | Yes         | Yes        | 1        |
| app_private.account_access   | Yes         | Yes        | 1        |
| public.shipments             | Yes         | Yes        | 3        |
| public.shipment_events       | Yes         | Yes        | 2        |
| public.invoice_files         | Yes         | Yes        | 1        |
| public.report_recipients     | Yes         | Yes        | 1        |
| public.admin_events          | Yes         | Yes        | 1        |
| app_private.command_receipts | Yes         | Yes        | 2        |

The writer and access-reader roles have no login, superuser or BYPASSRLS privileges. The migrations and actual PostgreSQL behavior were checked; RLS verification is supported by the real database suite below, not merely these metadata flags.

## Commands actually executed

The requested sequence ran on the Phase 3B checkout: `npm run test:db`, then `npm run check`.

| Check                                     | Result                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Database integration tests                | **20 passed, 0 failed, 0 skipped**; approximately 21.9 seconds              |
| Application/domain tests                  | **36 passed, 0 failed, 0 skipped**                                          |
| Prettier / Oxlint                         | Passed                                                                      |
| Strict TypeScript / Vite production build | Passed                                                                      |
| supabase db lint --local --level warning  | No schema errors; empty results/warnings list                               |
| Fixture cleanup                           | Zero profiles, Auth users, shipments, events and receipts left by the suite |

Database cases cover cross-owner and inactive/anonymous denial, protected roles, administrator AAL2 claims, direct-write and employee deletion denial, forged fields/metadata, numbering, concurrent creates/retries, idempotency-key reuse, revision conflicts, completion/reopening, exact 96-hour boundary, soft deletion/restoration, audit protection and Unicode/phone validation.

Local raw logs are ignored under `artifacts/phase-3b-final/`. Generated local API keys were used only in memory for readiness GETs and were not printed or committed. A readiness probe is not an end-to-end Auth security test.

## Impeccable and Codex

Pinned Impeccable skill **4.8.0**, engine **0.1.18**, passed the committed `setup-impeccable.ps1 -CheckOnly` in the application checkout. The active Codex maintenance worktree was a separate folder without generated skills; its same approved checksum-pinned installation was recreated and CheckOnly also passed. Both have project-local skill files, Codex hook manifests and local consent. Shared PRODUCT/config/toolchain files were preserved.

The current conversation's initial skill catalog did not list Impeccable. Reopen the relevant workspace/allow a new skill-discovery turn and invoke `$impeccable` when design work is approved. Files and CLI compatibility are verified; active automatic Codex hook execution and a refreshed runtime catalog are **not independently verified**. Any separate machine trust prompt remains for the user. No design command or UI redesign was run.

## PR review and remaining issues

Both PRs were read through GitHub after fetching:

- [PR #5](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/5): open, non-draft, mergeable/CLEAN against current main; head is the verified Phase 3B checkpoint. Scope is local configuration, migrations, tests, pinned CLI and related documentation, without frontend wiring.
- [PR #6](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/6): open, non-draft, mergeable/CLEAN against current main; scope is workflow scripts/docs and sanitized readiness reports, without Phase 3B implementation. Its initial head was the verified maintenance checkpoint above; this report is a subsequent documentation-only update.
- Neither has recorded GitHub reviews or CI check runs. Local executed checks must not be described as GitHub CI. No review was submitted and neither PR was merged. Shared AGENTS/README changes need deliberate reconciliation when integrating approved work.

**Confirmed local network hardening item:** Docker publishes PostgreSQL 54322 and gateway 54321 on wildcard host addresses (`0.0.0.0`/`::`); the Windows listener inventory includes `::`. Loopback HTTP works, but LAN reachability and firewall containment were not proven. Before storing real data or expanding Auth work, restrict the local stack to loopback or establish and verify an explicitly approved equivalent network boundary. No firewall, bind setting, container or volume was changed during this verification. RLS does not replace protection of the PostgreSQL administrative endpoint.

**Tooling limitation:** the earlier Docker per-user launcher registry anomaly has no proven permanent shortcut/reboot fix. The current supported CLI path and engine are operational; preserve current VM disks/volumes if a future repair is approved.

**Future security scope:** database tests use real SQL roles with synthetic request claims. HTTP JWT signature enforcement, password sign-in/session lifecycle, MFA enrollment/recovery, account administration, private Storage bytes/policies, frontend/backend adapter, backup restore and production performance have not been verified or implemented by this phase. Audit data is protected from application actors, not from PostgreSQL administrators. Retention, region, RPO/RTO and budget decisions remain open.

## Approval recommendation

Phase 3B's isolated database foundation passes its fresh HOME functional/security suite and is **ready for the user's review and approval**, with the local-network hardening item explicitly outstanding. This is not production security clearance or permission to merge. Address/agree the local network boundary before using real data or broadening authentication work.

Next, obtain separate decisions on PR #5 and PR #6, reconcile their approved shared documentation, and define the Phase 3C scope and starting base. A sensible first proposed slice is authenticated sessions/MFA and negative HTTP authorization tests before application integration, but that scope is not approved here. No Phase 3C branch or code was created.
