# Phase 3C.4 — local connected shipment commands

**HOME verification, 28 October 2026. Candidate in Draft PR #13; not merged.**

Approved main: `3497b2fbaa166fa9858712558adc9641f8a8d912` (Phase 3C.3). The clean HOME checkout fetched origin and switched to the existing `feature/phase-3c4-connected-shipment-commands` at PM checkpoint `5ca1545763e1ae41a142ee4221e84ce4305ec077`. Existing worktrees, ignored files, retained accounts/MFA and databases were preserved. The final verified PR head is the published checkpoint; a commit cannot record its own hash.

## Implementation

- `command-model.ts` validates an exact, frozen RPC envelope. Only the six required shipment fields and optional phone/invoice number/notes are sent for create/update. Empty optional fields become null. Owner, UUID, TR number, start time and audit data come from PostgreSQL. Invoice bytes are excluded. Revisions and numbers remain signed-int64 decimal strings.
- `command-repository.ts` calls the official Supabase client's `shipment_command` RPC with automatic transport retries disabled. The browser transport allows this exact POST alongside the existing narrow read/Auth APIs; arbitrary functions, direct table writes and storage endpoints remain blocked. Existing RLS and the SECURITY DEFINER command function enforce active accounts, employee ownership and administrator AAL2.
- `command-session.ts` persists one exact request UUID and payload per account/tab before sending. Double submission is blocked. Unknown network/5xx/malformed-receipt outcomes retain that intent across reload; retry reuses it byte-for-byte at the argument level. Known rollback errors permit a new explicit intent. A retry receipt is not row state: current authorized data is fetched again. Acknowledged-save/read failures offer refresh without another write.
- `ConnectedForm.tsx` reuses existing fields, validators, translations and controls. Unsaved values and the original revision survive reload. A conflict retains the draft, shows all current values and requires explicit review/revision selection before another save. Background refresh cannot silently replace an edit snapshot.
- `ConnectedActions.tsx` uses existing accessible native dialogs for completion/time editing, reopening, soft deletion and restoration. Confirmations hold their opening revision. Employees never receive deletion/restoration controls. Completion uses the native input's actual submitted value and strict Riyadh-to-UTC conversion, with server validation. A fresh authorized clock is fetched at dialog opening without adopting a newer revision; elapsed time uses a monotonic clock. Invalid or unverifiable times fail closed.
- Lists, details, counts and history invalidate after acknowledged changes; background polling preserves mounted dialogs and removes data on authorization/error responses. Logout/account changes clear only the new command/draft namespaces and connected resources; late responses are ignored. Demo storage/provider/domain files are untouched.
- Arabic/English success, conflict, validation, denied, uncertain and saved-but-not-refreshed states are explicit. Labels/help text, input focus, Escape and focus restoration were checked. Readability changes are connected-only: metadata/secondary fonts, 16px form fields, informative empty states and a mobile employee create action. Approved branding, layout and Demo styles are preserved.

PostgREST maps SQLSTATE `40001` to HTTP 500. The adapter recognizes the existing `shipment_conflict` code/message before treating an unknown 5xx as uncertain; it does not retry a known revision conflict. No applied migration or function body was changed. References: [PostgREST error mapping](https://docs.postgrest.org/en/stable/references/errors.html), [Supabase RPC client](https://supabase.com/docs/reference/javascript/rpc).

## Local use and recovery

Keep the existing local Supabase services and their five applied migrations; this milestone needs **no new migration**. Do not run reset, seed, container recreation, account provisioning or password/MFA setup to try these commands. Use the retained fictional local accounts; privileged credentials remain outside Vite/React.

```sh
npm run dev
npm run dev:connected
```

Demo: `http://127.0.0.1:5173/`. Connected: `http://127.0.0.1:5174/workspace`. Do not start duplicate servers if these previews are already running. Connected Mode remains opt-in; approved local public-client configuration is required.

The new `vs.connected.pending-command.v1` and `vs.connected.shipment-draft.v1` keys live in sessionStorage, bound to the authenticated account. One draft and outstanding command are supported per tab. They survive reload, not logout/tab closure or computer switches. Resolve an uncertain request with **Retry the same request** before another edit; closing a dialog does not cancel an already-sent request. If recovery storage is unavailable/corrupt, new writes fail closed. Do not manually replace a pending key, assume an HTTP timeout rolled back, or resubmit a create with a new key without checking the authorized register. No browser-wide/offline queue is claimed.

## Actual HOME verification

| Check                                                           | Result                      |
| --------------------------------------------------------------- | --------------------------- |
| Application/unit tests, including 11 new command/recovery cases | 70 passed, 0 failed/skipped |
| Real signed-JWT HTTP/security tests                             | 25 passed, 0 failed/skipped |
| Local Auth tests                                                | 13 passed, 0 failed/skipped |
| PostgreSQL integration tests                                    | 20 passed, 0 failed/skipped |
| HOME/SCHOOL workflow tests                                      | 20 passed, 0 failed/skipped |
| Formatting, Oxlint, TypeScript, default build and bundle scan   | Passed                      |
| Connected build and privileged-credential bundle scan           | Passed                      |
| Local Supabase schema lint                                      | No schema errors            |

The six additional real HTTP cases cover full lifecycle/audit actions, genuine administrator AAL2 operations on another owner's row, cross-owner/inactive/orphan/AAL1/forged-field denial, simultaneous creates, CAS races, idempotent replay and reused-key rejection, revisions above JavaScript's safe integer range, and a real committed response deliberately lost before retry after simulated reload. The latter uses the real RPC through the browser transport, not a mocked database. All earlier read/RLS, forged/expired JWT and exact 96-hour boundary regressions remain included. Denied requests leave no mutation/event/receipt artifact. Unit tests also cover storage failure/corruption, account/logout namespace isolation, double click, late-response cancellation, stale receipts, post-save read failure, original draft revisions and invalid Riyadh calendar/time boundaries.

Workflow tests ran from byte-verified copies of the four unchanged workflow scripts in a disposable temporary fixture directory to avoid Vite file locks. Actual local runs, not school or CI history, support this table. The guarded publication command reruns application/static/build and database checks before committing.

### Browser acceptance

- Existing employee A created an Arabic shipment with fictional phone, Unicode invoice and multiline notes; edit/reload retained unsaved values and saved PostgreSQL data. Native required-field errors focused the first invalid input.
- An independent A edit stayed at its original revision while the retained administrator changed that row. Save returned a conflict without overwriting; review showed all latest fields, preserved the draft and required an explicit new revision before saving.
- Manual completion and completion-time editing persisted the exact entered Riyadh instant in PostgreSQL. An invalid native input was rejected; fresh-clock fetching resolved a stale-server-clock issue found during acceptance. Reopening retained original owner/start/number.
- The retained administrator soft-deleted and restored A's row. A saw generic unavailability while deleted and regained the original record/history after restoration. The administrator also created an owned row; employee access to it was denied.
- Logout and login as existing employee B showed no A cache. B created a separate English shipment, completed/reopened it on mobile, and could not open A's edit route. Administrator AAL2 saw all three records. Audit revisions/actions were inspected alongside the HTTP assertions.
- Arabic RTL and English LTR desktop/mobile were exercised. At 390px viewport, content width and scroll width were both 375px (scrollbar accounted for), form inputs were 16px, and the mobile create action remained available after the list became nonempty. Escape cancellation restored focus. Screenshots are private ignored QA artifacts.

### Preservation and limits

A fresh private PostgreSQL custom archive was byte-hash and inventory verified before testing. All original application rows, retained account/password and MFA fingerprints, RLS/policies/grants, command owner/ACL/body, migration versions, cluster identity and four Docker service identities/mounts/localhost bindings are preserved. The number sequence advanced through test commands and was never reset.

After the owner explicitly approved scoped cleanup, the three identified `QA3C4-20261028` browser-created fictional shipments (TR-0381, TR-0398 and TR-0412), their 13 test events and 13 test receipts were removed in one checked transaction. Before deletion, a fresh private archive was byte-hash and inventory verified, and exact UUIDs, fictional labels, owners, revisions, numbers and history counts were checked; unexpected changes would have aborted cleanup. No other rows were targeted. The strict preservation comparison now matches the original eight-table baseline without exclusions, together with unchanged security/identity state. The sequence was not reset and those TR numbers will not be reused. Automated suites cleaned their own disposable fixtures. Private backups, credentials, fingerprints, screenshots, test logs and runtime helpers are ignored and never published. Existing retained accounts were not recreated or changed. The implementation checkpoint was `a436640d77fad8ece269eb6fd14d37fcf6e2166b`; the cleanup follow-up changes documentation only.

Persistence was verified after browser reloads, through independent authorized clients and PostgreSQL queries. Docker services were deliberately left running; no restart-persistence test is claimed. Local browser profiles share one local backend; this is not HOME/SCHOOL database synchronization. Invoice uploads, connected reporting, account recovery/management, production readiness, deployment and Phase 3C.5 remain outside scope. PR #13 remains Draft and unmerged for project-manager review.
