# Phase 3C.2 — protected local accounts and administrator MFA

**Implemented and locally verified candidate for project-manager review.** Branch `feature/phase-3c2-secure-accounts-mfa`, existing draft [PR #10](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/10), based on verified Phase 3C.1 merge `c9c15347d5fc95075ade8438311479b3cb07ac0c`. The owner explicitly authorized implementation of this milestone. No later phase, merge, cloud connection or deployment is authorized.

## Implemented scope

- Trusted Node-only provisioning creates three fictional local identities (administrator, employees A/B), confirmed through local Auth, followed by protected profile/account_access inserts through the local SQL operator. No public signup, browser service key, invitation or account-management endpoint exists. Credentials stay only in ignored `local-data/phase3c2-accounts.local.json`.
- The previously exposed fictional Phase 3C.1 preview password was rotated before reuse. Its old password was rejected, the new password verified, and refresh sessions revoked. The original identity remains unprovisioned; it cannot become an employee/admin by signing in. The updated credential remains in the same ignored local file. No credential value was printed or uploaded.
- New forward-only migration `20261028020000_self_account.sql` adds `get_my_account()` with no identity/role parameters. Its owner is a dedicated non-login/non-BYPASSRLS role with self-only profile SELECT, narrow protected-access helper execution, no account mutations and no shipment privileges. PUBLIC/anon/service-role execution is revoked in the migration transaction; authenticated receives only the needed execution grant. The two applied Phase 3B migrations are unchanged.
- Self lookup returns only the verified caller's active profile/role and signed assurance state. Missing or inactive access returns a generic state without a profile/role. It never derives permissions from editable user metadata.
- The bilingual Connected shell distinguishes employee, administrator AAL1 onboarding, administrator AAL2, unauthorized/inactive and lookup-error states. No connected shipment lists, reads, writes or reports are implemented. The browser transport allows local Auth plus only the exact POST self-account RPC; generic Data API/shipment paths remain blocked.
- Administrator TOTP setup uses official SDK enrollment, factor listing, challenge/verification and new Auth sessions. AAL1 has no operational access; real successful TOTP verification produces AAL2. QR/manual setup material is transient component state, never localStorage, logs or analytics. Arabic/Persian code digits are normalized; fields have labels, focus/error feedback and native validation. Existing factors are never removed by this UI. Unfinished setup is preserved for completion in its original tab or separate operator review.
- Existing operational RLS, employee ownership and administrator AAL2 checks remain authoritative when React is bypassed. Account changes are reread by the UI on focus and every 30 seconds; backend deactivation is immediate for already issued JWTs. A short-lived role display is never an authorization decision.

## Local use and operator boundaries

Keep both existing previews running:

```powershell
npm run dev -- --host 0.0.0.0
npm run dev:connected
```

Demo remains `http://127.0.0.1:5173/`; Connected remains `http://127.0.0.1:5174/`. Use the fictional local credential manifest; never company identities. Default Demo Mode requires no Auth configuration and retains its existing provider, routes, role picker, records and workflows.

On a verified fresh local stack, review pending migrations, make a private backup, then apply only pending forward migrations using the pinned CLI's `migration up --local`. Do not reset, link or push a hosted database. HOME already has this migration and the three accounts; do not recreate them.

```powershell
npm run accounts:local
```

The bootstrap has no arbitrary user/role arguments and refuses an existing manifest. It reserves the file exclusively before creating identities and saves each generated credential before SQL provisioning. If interrupted, stop and inspect the partial manifest/database with the trusted local operator; do not delete/retry or silently replace identities. It is a fictional development fixture tool, not company account lifecycle management.

`npm run auth:rotate-preview` is a guarded one-time rotation for the previously exposed fictional Phase 3C.1 identity; HOME has already completed it. It refuses a non-fictional/mismatched identity or an already rotated file. Rotation is not a recovery bypass. Supabase access JWTs can remain valid until expiry after refresh-session revocation; the retained preview identity has no application access regardless.

## First administrator and recovery

The first fictional administrator is assigned only by the trusted local Auth/SQL bootstrap, never by public registration or user metadata. That administrator must enroll and verify an authenticator before operational access is possible. Later password logins remain AAL1 and must complete a new TOTP challenge; a previous session's AAL2 is not inherited.

No self-service MFA removal, password reset email, recovery code, administrator demotion/deactivation UI, last-admin mutation command or emergency bypass is included. If an authenticator is lost, stop connected administrator use and contact the trusted local operator. A separately approved recovery/lifecycle milestone must establish identity checks, audit and concurrency-safe last-admin protection before any recovery actions are added. Do not manually remove a verified factor to bypass this gate.

## Actual HOME tests — 28 October 2026

| Check                                | Actual result                                                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed-JWT HTTP/TOTP security suite  | **13 passed, 0 failed, 0 skipped**                                                                                                                                                       |
| Existing real Auth integration       | **13 passed, 0 failed, 0 skipped**                                                                                                                                                       |
| Application/unit suite               | **53 passed, 0 failed**, all previous 46 preserved                                                                                                                                       |
| Existing PostgreSQL integration      | **20 passed, 0 failed, 0 skipped**                                                                                                                                                       |
| Workflow suite                       | **20 passed** in byte-identical isolated scripts                                                                                                                                         |
| Formatting / Oxlint / TypeScript     | Passed, including separate trusted-helper TypeScript check                                                                                                                               |
| Default and Connected builds         | Passed                                                                                                                                                                                   |
| Both browser bundle credential scans | Passed, including all generated local fixture credentials                                                                                                                                |
| Schema lint                          | No schema errors, empty warning-level results                                                                                                                                            |
| Preservation                         | Existing application rows, cluster/volume, original services/bindings and original Auth identity preserved; only three intentional fictional accounts and one forward migration added    |
| Browser role/MFA acceptance          | AAL1 prompt, wrong/correct TOTP challenge, AAL2 reload, new-login step-up, employee shell, inactive/unprovisioned denial and Arabic mobile layouts passed; enrollment distinction below. |

Run separately; `npm run check` does not substitute for real HTTP/Auth/database verification:

```powershell
npm run test:security
npm run test:auth
npm run test:db
npm run check
npm run build:connected
node scripts/check-client-bundle.mjs dist-connected
powershell.exe -NoProfile -File scripts/test-sync-workflow.ps1
```

The security suite uses real locally issued signed employee/admin tokens over Auth/PostgREST HTTP. It covers employee A/B isolation via tables/RPC/history/invoice metadata, guessed IDs, metadata forgery, missing profile/access, inactive accounts and immediate live deactivation, administrator AAL1 denial, invalid/correct TOTP, actual AAL2, a new password-only admin session after enrollment, denied direct writes/role assignment/audit mutation, no artifacts after denied commands, and tampered/actually expired signed tokens. A valid control token verifies the expiry fixture's signature first. Test fixtures are freshly generated and only their own records/identities are cleaned up; no operational data is imported or deleted. Sequence values advance normally and are never reset.

Browser tests used a separate `http://localhost:5174/` origin so the retained administrator's `127.0.0.1` session/setup was not changed. A disposable fictional administrator's factor was enrolled and verified through the same trusted local SDK fixture path; the browser then performed ordinary existing-factor authentication. Incorrect codes showed safe feedback; correct codes reached the real AAL2 shell; reload retained AAL2; a new password login again required the challenge. A retained employee displayed the employee role without administrator controls; a deliberately deactivated disposable identity and the rotated unprovisioned preview identity displayed their respective denial states. The disposable identity/factor/profile/access were removed afterward; retained accounts and existing browser records remain intact. English desktop and Arabic RTL 390px mobile/light/dark views were visually inspected with no horizontal overflow. Evidence is private under ignored artifacts; screenshots contain no QR/setup key/password/token. Physical-device and Safari/Firefox certification are not claimed.

Earlier failing harness runs were corrected: SQL helper calls needed statement termination, response assertions needed the existing RPC denial semantics, and synthetic public keys needed base64url formatting. Final results above come from executed passing suites, not historical SCHOOL evidence or GitHub CI.

## Follow-up safety hardening — current continuation

The owner authorized autonomous safe work while reserving credential changes, destructive operations, Docker replacement, production changes and merges for explicit approval. No retained credential or MFA factor was changed during this continuation. No new database migration or Docker operation was required.

Automatic cleanup of unfinished MFA factors was removed because a stale unverified snapshot could race with verification elsewhere. The setup helper has no removal API: it rereads factors, switches to challenge when one is now verified, preserves an unfinished own setup without creating a duplicate, and stops if the component/session is no longer active. Responses arriving after unmount discard private setup material without attempting deletion. Initial factor-list promise failures now show the existing safe error state. Arabic/Persian digit normalization is covered independently.

Seven focused tests were added (53 application tests total). Fresh execution passed 13 real Auth, 13 signed-HTTP/MFA security, 20 PostgreSQL and 20 workflow tests, plus formatting/lint/TypeScript, both builds and credential scans. Existing SQL/application role boundaries remain unchanged. The current Arabic administrator onboarding screen was inspected read-only on desktop/mobile, without clicking enrollment, typing a new credential or changing the account. Earlier browser challenge/role acceptance belongs to the prior published checkpoint; it was not silently repeated with retained credentials here.

The retained administrator's manual enrollment remains a permission/user-entry gate. The latest instruction requires explicit approval before credential changes, and browser credential enrollment also requires secure user input. Do not auto-enroll, reset or remove its factor while the owner is away. Existing automated tests use only their already approved disposable fictional fixtures; they do not alter retained accounts. This outstanding manual acceptance step does not block the independent code/test hardening above.

## Known boundaries

- Existing Phase 3B commands raise `P0002 / record_unavailable` for both cross-owner and nonexistent shipment edits. PostgREST maps this to **HTTP 500**. Adversarial tests prove identical generic responses and no shipment/audit/receipt mutation. Authorization fails closed; the HTTP error mapping remains an API usability issue to address before the later connected-command milestone. Applied migration/business contracts were not rewritten to hide this finding.
- Real SDK/backend enrollment and browser existing-factor challenge are verified. The retained fictional administrator's manual authenticator enrollment is a separate secure user handoff and has not been completed by the agent; no full manual browser-enrollment walkthrough is claimed. Its setup screen is available at the main Connected preview. The agent must not enter or publish the user's new enrollment key/code. This does not bypass MFA: that retained account remains AAL1 until its owner completes enrollment.
- Account lifecycle, recovery/last-admin concurrency, connected shipments, private invoice bytes, production readiness and physical HOME/SCHOOL shared data remain outside this slice. No new package, container recreation, database reset, SMTP, external provider, production service or deployment was added.

The database backup and inspection/test evidence are private under ignored `artifacts/network-security/`; credentials are under ignored `local-data/`. Do not upload them. Keep PR #10 Draft and unmerged; publish only reviewed source/docs with exact remote-hash verification, then stop for project-manager approval.
