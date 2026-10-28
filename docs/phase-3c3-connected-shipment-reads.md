# Phase 3C.3 — local connected shipment reads

28 October 2026 · HOME verification · candidate for project-manager review in Draft PR #12. No merge, shipment mutations, deployment or production connection is included.

## Source and scope

The clean application checkout at `C:/Users/qo0op/Desktop/vision-solution-tms-SYS` fetched origin and safely switched from the synchronized HTTP 404 branch to the existing tracked `feature/phase-3c3-connected-shipment-reads`. Approved main `eac7bcabda0f08ca099e2c5e395bbf200554c44e` is an ancestor; PM handoff is `6c613941899b54c272ccecec1af68fd17647cd2a`. No history was discarded, stashed, reset, cleaned or force-pushed. Other worktrees are preserved. Read the PR head for the final published SHA; a commit cannot contain its own hash.

The default Demo remains separate on `http://127.0.0.1:5173/`. Opt-in Connected Mode runs with `npm run dev:connected` on `http://127.0.0.1:5174/workspace`, using the existing local public-client configuration and protected Auth accounts. It now displays real authorized records; it never imports demo seed data. Connected create/edit/complete/reopen/delete/restore, invoice bytes, reports/scheduling and account management are intentionally absent. Demo retains its full workflows.

## Read architecture and authorization

- `ShipmentReadRepository` exposes only list/detail/history. The Supabase adapter validates response contracts and maps generic denied/unavailable/connection states. No service keys or role selection authorize reads.
- New `read_shipment_page` is a stable SECURITY INVOKER function over the existing invoker overview/RLS. It validates literal substring search (maximum 200 characters), status, active/deleted scope, optional owner UUID, newest/oldest order, page size 1–100 and offset 0–1,000,000. Ties use UUID ordering. Search includes Arabic/English fields, UUID/TR, phone, invoice number and notes. Percent/underscore/SQL-looking text stays literal.
- Rows, filtered total and status counts come from the same server snapshot. Counts cover the selected scope/search/owner before the status tab; `total` is the selected-status count. All counts, shipment numbers and revisions cross JSON as decimal strings. Pagination arithmetic compares `BigInt` values without converting totals to JavaScript numbers; the bounded numeric offset is separate.
- Detail uses the existing bounded `get_shipments` RPC with the UUID, never the TR label. New `read_shipment_history_page` bounds events/counts and returns the same HTTP 404 for nonexistent and invisible UUIDs. Actor UUIDs are labeled explicitly; no broad employee directory lookup was added.
- Employee A sees only its active owned records; A cannot inspect B's list, details, events or deleted register. Inactive/unprovisioned identities and administrator AAL1 fail closed. Active administrator operational reads/deleted records require genuine AAL2. Existing RLS, table grants, protected roles, command function and audit protections are unchanged. Anonymous/service-role execution of the new RPCs is revoked; only authenticated receives EXECUTE.
- PostgreSQL's strictly-greater-than-96-hour result is authoritative. The UI retains `server_now` and refreshes every 30 seconds/on focus. It never recalculates status from the client wall clock or loses the server's sub-millisecond boundary precision. The existing status component has an optional resolved-status input; all Demo callers retain the unchanged domain-clock default.
- UUID identity is separate from TR display ID; bigint number/revision strings, optional phone/invoice/notes and Unicode/newlines survive mapping. Invoice image bytes remain unavailable and clearly labeled.
- Read resources are component/session scoped in memory, without persistent or global shipment caches. Logout, account/session/role changes, query changes and unmount abort/discard resources; generation guards reject late results even if transport ignores cancellation. Refresh failures remove old data. Account lookup results are masked immediately on session-scope changes.
- The browser transport allows only exact POST self/page/detail/history RPC paths and local Auth. Commands, raw table requests, arbitrary RPCs, GET RPCs, storage and external redirects remain blocked.

The approach follows [Supabase RLS and invoker views](https://supabase.com/docs/guides/database/postgres/row-level-security) and [PostgREST RPC contracts](https://docs.postgrest.org/en/stable/references/api/functions.html). Existing policies enforce row authorization; React controls are presentation only.

## Database application and preservation

Only new forward migration `20261028120000_connected_shipment_reads.sql` was applied using the pinned CLI's `migration up --local`. All four previously applied migrations remain unchanged. The database now contains five migration versions; use the matching source until PR #12 is separately approved.

Before application, a fresh private custom-format PostgreSQL archive was created, copied into ignored local artifacts, compared by SHA-256 and inspected with `pg_restore --list`. Required application/Auth/MFA/migration objects were present. No restore was performed or claimed. Private backups, fingerprints, generated fixture passwords, raw logs and screenshots are not committed.

After tests and the explicitly approved browser-fixture cleanup, fingerprints match the pre-migration baseline for all eight application tables, retained Auth identities/passwords/MFA, RLS/forced flags/policies, table grants and the entire shipment command function identity/body/ACL/owner/configuration. Database cluster, container identities/images/volumes/localhost bindings match. Sequence numbers may advance through disposable tests and are never reset or reused.

Docker Desktop was initially stopped. Starting the existing engine exposed a restart-order IP collision: the dynamic REST container had occupied the database's configured address, then Auth's. Starting the original DB and Auth before the original REST resolved it. No Docker container, volume, network configuration or retained account was recreated/replaced. Existing rollback containers remain stopped. Vite previews were started in persistent host terminal sessions after sandbox network timeouts; both remain running.

## Actual verification

These are fresh HOME executions, not historical school or CI claims.

| Suite/check                                                          | Result                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------- |
| Signed HTTP/JWT/TOTP/RLS security (`npm run test:security`)          | 19 passed, 0 failed/skipped                           |
| Real local Auth/session regression (`npm run test:auth`)             | 13 passed, 0 failed/skipped                           |
| PostgreSQL integration (`npm run test:db`)                           | 20 passed, 0 failed/skipped                           |
| Application/domain/read-resource tests (`npm run check`)             | 59 passed, 0 failed                                   |
| Unchanged HOME/SCHOOL workflow suite                                 | 20 passed in byte-verified temporary offline fixtures |
| Formatting, Oxlint, strict TypeScript, default build/credential scan | Passed                                                |
| Connected build/credential scan                                      | Passed                                                |
| Applied schema lint (`db lint --local --level warning`)              | No schema errors                                      |

The security suite adds real signed HTTP checks for page/history ownership, admin AAL1/AAL2, inactive/missing accounts and live deactivation, anonymous/forged/expired JWTs, deleted-scope denial, search/validation bounds, stable pagination, counts, optional Unicode values, UUID/TR mapping and bigints above JavaScript's safe integer range. Existing command/ownership/audit/idempotency regressions remain green. Resource tests prove cancellation, logout clearing, late-response rejection and failed-refresh recovery. Existing DB tests verify the exact 96-hour boundary.

## Browser acceptance and limits

The owner explicitly approved two isolated fictional employee accounts/eight shipments for browser acceptance after automatic review requested that narrow authorization. Only these disposable fixtures were removed afterward; retained accounts, passwords, factors and records were unchanged. No browser credentials or tokens appear in saved evidence.

- Retained administrator AAL2 session loaded both employees' records without re-enrollment or credential changes. AR/EN dashboard/table, counts, search/status filters and the empty deleted register worked.
- Arabic desktop navigation stayed on the right. Mobile admin drawer opened/closed/navigated; the approved responsive table-to-card behavior was verified after correcting its wrapper class.
- Employee A showed only seven own records; next-page navigation showed its seventh record. Own detail/history, phone link, invoice number, notes and server dates were displayed; direct B detail returned only the generic unavailable state.
- Logout removed read state immediately; B then saw only its one shipment without cached A content. Searching for A returned the empty state. Search kept keyboard focus during query updates. Existing Auth tests separately verify reload after logout and protected sessions.
- English LTR desktop/mobile and Arabic RTL mobile/detail were inspected; 390-pixel mobile viewport had no document overflow. Light/dark appearance, visible status text/icons, labeled controls and native navigation/dialog semantics were checked. Temporary preferences/viewport overrides were restored and the main administrator session was preserved.
- Original Demo entry remained functional and unchanged; its existing domain/workflow/persistence regression suite passed. No UI mutation path was added to Connected Mode.

This milestone does not claim load testing on a production-sized dataset, shared physical HOME/SCHOOL database access, a production readiness audit, connected reports/writes, invoice-byte support or a browser-level simulated offline run. Connection/denial/retry and stale-cache behavior have automated coverage; real local request failures and protected-route states were exercised. Offset pagination has the explicit safety ceiling above; narrow search at the ceiling.

## Review gate

Update PROJECT_STATUS and existing Draft PR #12, publish only reviewed source/tests/docs to the approved feature branch, verify remote HEAD and stop. Keep the local previews and preserved database running. Merging PR #12 and starting Phase 3C.4 require separate approval.
