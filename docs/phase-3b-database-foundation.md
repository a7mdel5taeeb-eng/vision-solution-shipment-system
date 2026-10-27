# Phase 3B — secure database foundation

**Scope:** isolated local Supabase/PostgreSQL foundation. The approved frontend remains browser-local. No production project, credentials, accounts, storage bucket, email, deployment, DNS or public website changes are included.

## Approved baseline and Git history

The user approved the Phase 3A architecture and merging PR #4. Its three documentation files and commit `5b5e450b0b66c34ee94b6bb38211b4e0b4d5ccc5` were reviewed; `npm run check` passed before merging. GitHub confirmed merge commit **`7fb40c9bfde944a6f7c3cee57da822a164801890`**, and clean local `main` was fast-forwarded to the same commit. No uncommitted work was discarded.

This foundation uses the requested `feature/phase-3b-database-foundation` branch. Phase 2.9 remains the approved UI baseline. Production wiring and Phase 3B merge need separate approval. The expected initial scale is **2–5 users**, expandable; shipment volume is not assumed fixed.

## Files and responsibility

| File                                                       | Responsibility                                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/config.toml`                                     | Dedicated local project `vision-solution-local`, PostgreSQL 17, no public signup/anonymous Auth; Storage, SMTP, Realtime, Studio, analytics and Edge runtime disabled |
| `supabase/migrations/20261027091000_foundation.sql`        | Eight tables, constraints, indexes, private roles/helpers, RLS and restricted grants                                                                                  |
| `supabase/migrations/20261027091100_shipment_commands.sql` | Validated transactional commands, immutable identity trigger, status/read view and authorized retrieval functions                                                     |
| `tests/database/foundation.test.mjs`                       | Real PostgreSQL authorization, workflow and concurrency integration tests with fictional identities                                                                   |
| `tests/database/local-postgres.mjs`                        | Local Docker-only psql harness; no hosted database URL accepted                                                                                                       |
| `scripts/test-database.mjs`                                | Fails clearly on missing infrastructure before running database tests                                                                                                 |

The migrations are for a new dedicated Supabase database with its existing `auth.users`, `auth.uid()`, `auth.jwt()` and API roles. They are not generic standalone PostgreSQL bootstrap scripts. Do not apply them to an unrelated or occupied database. Once a migration reaches a shared environment, append a new migration instead of editing it.

## Data model

All eight tables have UUID primary keys and appropriate foreign keys. `profiles.id` references `auth.users.id`; account deletion is restricted to preserve ownership and actor history. No accounts or shipments are seeded by the migrations.

- `profiles`: bounded Unicode display names and timestamps. No editable browser role or duplicate Auth password/email store.
- `app_private.account_access`: unique profile reference, checked administrator/employee role, active flag and revision. Default inactive; ordinary API users have no table privileges.
- `shipments`: immutable UUID/owner/original start, unique server identity sequence number, required shipment fields, nullable driver phone/invoice number/notes, workflow/completion, soft deletion/actor, update timestamp and revision.
- `shipment_events`: append-only for application actors, shipment/actor references, server time, action, unique shipment revision, changed field names and relevant completion timestamp. Full phone values and full field snapshots are not copied into events.
- `invoice_files`: private-object metadata shape only; generated UUID, shipment/uploader references, unique object key, lifecycle state, detected type, size and checksum. One available invoice per shipment; PNG/JPEG/WebP, at most 750 KiB. No upload or availability command exists yet, so browser users cannot publish arbitrary metadata.
- `report_recipients`: unique normalized email and enabled state; administrator-only reads. Recipient-write commands, the 20-recipient limit at the command boundary, delivery and scheduling remain future work.
- `admin_events`: restricted administrator audit shape. No browser insert/update/delete; account-administration commands are not implemented in this foundation.
- `app_private.command_receipts`: unique actor/request UUID, operation, SHA-256 fingerprint, shipment reference and minimal result receipt. It stores no submitted field payload or attachment bytes.

Arabic/English content is preserved as Unicode. Validators match current whitespace trimming, UTF-16 length limits, optional phone formats and six required fields. Driver phone is text, never numeric; Arabic/Persian digits and entered formatting remain intact. Invoices are optional; data URLs are deliberately excluded from database commands.

## Privilege boundary

All eight tables enable and force RLS. Anonymous users have no table/command grants. Authenticated users have scoped SELECT and only three public function entry points; direct DML, hard deletion, role changes, audit changes and identity sequence access are revoked, including from application administrators. Service-role credentials are not a normal application path and receive no application-table grants here.

`vs_command_writer` is a non-login, non-inheriting, non-owner role without superuser, role creation or `BYPASSRLS`. It owns only the mutation function, has narrowly granted shipment columns plus audit/receipt INSERT, and remains subject to writer-specific RLS. It cannot hard-delete shipments or alter events. Browser roles have no membership in it. `vs_access_reader` has only the protected access-table SELECT needed to read the current identity's role through its definer function.

Private role helpers resolve the active account from server-owned data. They ignore browser metadata. An administrator requires a signed request's `aal2`; inactive or missing profiles have no operational access. Employees see only their own non-deleted shipments; the parent policy also restricts history and invoice metadata. Administrators with MFA may inspect deleted records and perform delete/restore commands.

Supabase Auth startup reconciles the `auth` schema's grants, so custom roles must not depend on direct access to that schema. Two fixed, context-only definer wrappers owned by the migration role delegate to `auth.uid()` and `auth.jwt()`; they accept no arguments, read no tables, and use an empty `search_path`. The role-table reader and shipment writer use these wrappers. All other definer privileges and table ownership are separated as described above. Every new function explicitly revokes default PUBLIC execution in the same migration transaction.

The `app_private` schema is not exposed by the Data API. Schema usage alone does not grant its table access. The public read view is `security_invoker`, so it retains underlying RLS. There is no browser-settable bypass flag and no dynamic SQL in the commands. Refer to [Supabase function security](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) for the provider/database mechanics.

## Command and read contract

`public.shipment_command(operation, request_id, shipment_id, expected_revision, fields, completed_at)` supports `create`, `update`, `complete` (including completion-time edits), `reopen`, `delete` and `restore`. Typed parameters, operation-specific checks and a strict field allowlist reject owner/start/number/revision/deletion and attachment-data injection. Create/update accept a complete normalized form, not arbitrary table patches.

Create forces the authenticated owner, pending workflow and automatic server start. The database identity sequence assigns display numbers; format is `TR-0001` with at least four digits and no truncation for larger numbers. Gaps are allowed, including test consumption/rollbacks; numbers are never reused. There is no client counter or `MAX()+1` calculation.

Other commands lock the authorized row and require its expected revision. One concurrent edit wins and the other gets SQLSTATE `40001`/`shipment_conflict`; there is no automatic retry over a colleague's changes. Audit event, mutation, revision increment and request receipt commit atomically. An actor/request advisory transaction lock serializes duplicate requests. Same key and payload returns the original minimal receipt; different payload raises `22023`. Authorization is rechecked on retries. Receipts return UUID, number/revision strings, original start and action; a future adapter must refetch the authorized current row.

Completion must be finite and between original start and server now. The caller supplies an instant after interpreting manual input in Asia/Riyadh. Reopening clears completion and preserves original start. An identity trigger and column grants prevent changing UUID, number, owner or original start. Stored workflow is pending/completed only. The read view calculates overdue from statement time **strictly after 96 hours**, never at exactly 96 hours; completed records remain completed. No status scheduler exists.

`get_shipments(id?, limit=20, offset=0)` returns authorized overview rows with string bigint fields, display status and server time; maximum page size is 100. `get_shipment_history(shipment_id, limit=100, offset=0)` returns authorized chronological events; maximum 500. Another employee's IDs return no rows. Base tables remain RLS protected even if callers bypass retrieval functions. Unknown/invalid parameters use `22023`, denied operations `42501`, inaccessible mutation targets `P0002`, stale edits `40001`.

The future UI adapter must treat errors as typed domain results, retain unsaved form values on conflict and clear caches on session changes. This phase changes no provider, route, component, domain model, translation, style, branding asset, Impeccable configuration or browser storage key.

## Local setup on either Windows computer

**Existing HOME exception:** this setup section records the original fresh-project procedure. Do not run it on the already repaired HOME stack. Use the [existing-stack guidance](#existing-home-stack-after-approved-workflow-integration) and [verified restart runbook](home-localhost-repair-2026-10-27.md) instead; installation, npm ci and CLI stack recreation are not part of this integration.

The user explicitly authorized installing Docker Desktop and a pinned Supabase CLI during this phase. Installed CLI **2.122.0** is an exact development dependency in `package.json` and `package-lock.json`; `npm ci` reproduces it on the other computer. Docker Desktop **4.97.0** and its WSL prerequisite were installed on this computer; restarting Docker after WSL setup made the engine available without restarting Windows.

On the other computer, install Docker Desktop and its Windows/WSL prerequisites through the organization's approved process, then start its Linux-container engine. A Windows restart may be required there. Docker is a machine prerequisite, not something transferred by Git. Installation/license and school device permissions must be handled on that computer. See [Docker Windows setup](https://docs.docker.com/desktop/setup/install/windows-install/) and [Microsoft WSL setup](https://learn.microsoft.com/en-us/windows/wsl/install).

```powershell
git status --short --branch
git fetch origin --prune
git switch feature/phase-3b-database-foundation
git pull --ff-only origin feature/phase-3b-database-foundation
npm ci
npm run db:start
npm run test:db
npm run check
```

For a new clone, clone first and switch to the branch; preserve any existing work before switching. Start runs the local stack and applies migrations on a fresh project, without cloud login/linking. On an existing local database, review pending migrations and use `npx --no-install supabase migration up --local` when appropriate; never silently reset it. If a Windows shell predates Docker installation, reopen it so Docker is on PATH. The test harness also checks standard machine/user installation paths without a hardcoded username.

The dedicated container is `supabase_db_vision-solution-local`; API/database ports are 54321/54322. Use only the local Docker context. Database tests reject remote Docker endpoints and accept no production connection string. They insert fresh random UUIDs with `example.invalid` emails, assign actual PostgreSQL `authenticated`/`anon` roles and transaction-local identity/AAL claims, execute SQL, then remove only their own fixtures. They never create company users, passwords or send invitations. Test-created identity sequence gaps are expected.

The CLI `npm run db:stop` instruction applies to the original generic setup only, not the repaired HOME stack; use the existing-container restart runbook below. Test scripts never reset a database or apply migrations themselves. Do not run cloud `login`, `link`, `db push`, hosted resets or deployment commands for this phase. Local API keys printed by the CLI are development values; keep all keys and CLI machine state out of Git. The frontend needs no `.env` and remains independent of this stack. Do not run `npm ci` over an active Vite process on Windows; stop it first to avoid native-file locks.

## Existing HOME stack after approved workflow integration

The generic fresh-setup commands above record the original foundation setup. They are not the restart procedure for the repaired HOME stack. PR #6 is approved and merged as `9224acc3be9d9bbc2b2f5c0d7329ef10b5d235cb`; the user authorized integrating that verified main into this feature branch. PR #5 remains unmerged and needs separate approval.

For the existing HOME database, follow the [verified localhost repair/restart runbook](home-localhost-repair-2026-10-27.md). Do not repeat installation, npm ci, generic CLI stop/start, stack recreation or migration replay during this integration. Keep the existing volume, database identity, generated keys and stopped rollback containers. Generic CLI recreation can undo localhost binding; never start two PostgreSQL containers on the same data directory. With services already running, execute the database suite, local schema lint and project checks. The applied migration files remain byte-for-byte unchanged.

The [central status](PROJECT_STATUS.md) and [HOME/SCHOOL workflow](cross-computer-workflow.md) are now available on this branch. SQL-claim tests remain distinct from real Auth/JWT/MFA integration; Phase 3C is unapproved. No hosted database, production service, email or deployment is connected.

## Verification and limitations

Both migrations applied successfully on a fresh local Supabase PostgreSQL 17 database. **`npm run test:db`: 20/20 integration tests passed**, zero failed/skipped, in approximately 23 seconds. The test suite covers employee ownership, cross-employee denial, MFA administrator access, anonymous/unknown/inactive actors, metadata escalation and protected fields, direct-write denial, employee delete/restore denial, parallel creates, unique numbering, concurrent duplicate retries, conflicting edits, completion/reopening, invalid dates, exact overdue boundary, administrator soft deletion/restoration, audit protection, phone/Unicode validation and effective grants. The first run exposed provider-managed Auth schema grants; the context-wrapper correction was validated by fresh local replay and the passing suite.

| Check                                      | Result                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Fresh local migration replay               | Both migrations applied; PostgreSQL **17.11**                                                                                |
| `npm run test:db`                          | **20 passed, 0 failed, 0 skipped**                                                                                           |
| `supabase db lint --local --level warning` | No schema errors; empty warning/result list after correcting casts and volatility annotations                                |
| `npm run check`                            | Formatting, Oxlint, **36/36 frontend/domain tests**, TypeScript and production build passed                                  |
| Existing local demo                        | `/daily-report` HTTP 200; no browser data mutation                                                                           |
| Approved frontend files                    | No changes under `src/`, `public/`, `.impeccable/` or `PRODUCT.md`                                                           |
| Dependency review                          | Exact CLI dev dependency only; no existing locked package versions changed; installation audit reported zero vulnerabilities |
| Fixture cleanup                            | Zero remaining profiles, Auth users or shipments in the dedicated local test database                                        |

The initial local infrastructure was unavailable. After user-authorized installation of Docker/CLI and Windows elevation for WSL, the database ran successfully; RLS verification is therefore supported by executed database tests rather than deferred. Only this session's verified-empty disposable database was recreated while finalizing candidate migrations. No existing user database or browser data was reset.

These are **real PostgreSQL RLS/command tests**, using database role switching and identity claims as described in [Supabase testing guidance](https://supabase.com/docs/guides/local-development/testing/overview). They are not frontend mocks. They do not verify password sign-in, JWT signature verification by Auth/PostgREST, actual MFA enrollment/recovery, HTTP API behavior, Storage policies/byte validation, production performance, backup restore, or any browser-to-backend integration. Those require later focused tests and approval. SQL operators with administrative privileges can modify audit data; ordinary application users cannot.

## Decisions still required before production

- Select an exact data region after company residency requirements and latency review; this phase makes no residency/compliance claim.
- Approve shipment, attachment, audit, command-receipt and backup retention/purge policies. Receipts currently have no automated expiry.
- Accept an RPO/RTO and test recovery. Daily database backups do not include invoice object bytes; PITR and independent file backups need an explicit decision.
- Approve Supabase subscription, staging costs, SMTP and operating budget for 2–5 initial users; architecture prices are estimates to recheck when provisioning.
- Approve administrator bootstrap, invite/deactivation/role-management commands, last-administrator safeguards and Auth/MFA recovery procedures before account administration is connected.
- Approve private invoice upload/download/retention implementation and real SMTP/scheduled daily delivery separately. Metadata alone is not secure file storage.
- Complete independent security review, authenticated HTTP integration tests, backup/restore rehearsal and a separate frontend adapter phase before production access.

No production data import, public website change or deployment is authorized by this branch. This candidate foundation must not merge until the user explicitly approves Phase 3B.
