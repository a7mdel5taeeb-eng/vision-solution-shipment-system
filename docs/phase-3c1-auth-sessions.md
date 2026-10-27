# Phase 3C.1 — local Auth sessions

**Historical completed Phase 3C.1 report.** PR #9 was approved and merged at `c9c15347d5fc95075ade8438311479b3cb07ac0c`. The verification below records that milestone. Current Phase 3C.2 authorization and acceptance are recorded in [PROJECT_STATUS.md](PROJECT_STATUS.md) and the [Phase 3C.2 report](phase-3c2-secure-accounts-mfa.md); older pending-approval wording below is historical.

## Approved local Auth repair — completed

The prior `email_provider_disabled` blocker is resolved. The owner explicitly approved replacing only the local Auth container after a fresh private configuration/PostgreSQL backup, retaining its original stopped container for rollback. This was a narrow exception to PR #9's original no-container-recreation scope. Backup SHA-256 matched both copies and its custom-format inventory was verified before the replacement.

The healthy replacement preserves the exact image, keys, configuration, internal address and aliases, changing only `GOTRUE_EXTERNAL_EMAIL_ENABLED` from false to true. Global `GOTRUE_DISABLE_SIGNUP=true`, disabled anonymous login and absent SMTP remain unchanged. Real HTTP tests confirm public signup and anonymous sign-in are denied. The API, PostgreSQL and REST containers, mounts and published bindings were not replaced or changed. All eight application table contents, migration versions and database cluster matched the backup baseline after repair and after test fixture cleanup. Auth sessions and last-sign-in timestamps naturally change during login tests; the existing preview identity remains intact.

In pinned CLI 2.122.0, `[auth.email] enable_signup=true` maps to enabling the email provider. The separate global `[auth] enable_signup=false` still prevents public registration; both settings are deliberately present in `supabase/config.toml`. See [official Docker Auth configuration](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml) for the separate email-provider and global-signup flags. No signup UI, anonymous login, SMTP, OAuth or cloud service was enabled.

Private backup/configuration evidence stays under ignored `artifacts/network-security/`; it must never be uploaded. The original Auth container remains stopped as `supabase_auth_vision-solution-local_rollback_20261028-edeef3cd`. Do not start it alongside the replacement. Existing-container Docker start/stop preserves the repaired configuration. Generic Supabase stop/start/recreation can remove rollback containers or undo the prior localhost port repair; follow the [HOME restart runbook](home-localhost-repair-2026-10-27.md) and inspect service identities first. No database reset, restore, migration change or volume deletion was performed.

## Implemented boundary

- Official `@supabase/supabase-js` 2.118.0, installed without upgrading existing locked dependencies.
- Default Demo Mode stays at port 5173, with the original provider, routes, role selection, storage keys and shipment operations unchanged.
- Connected Mode is explicitly selected with Vite mode `connected`, normally port 5174. It never mounts DemoProvider and never uses the demo Admin/Employee selection to authorize a session.
- Connected routes are `/login` and protected `/workspace`; other connected paths return through that protected boundary. The authenticated page is a session-only scope, not a live shipment/admin dashboard.
- Persisted sessions are rechecked through local Auth getUser before route access. Official SDK refresh plus Auth events, expiry checks, stale-response rejection and loading/error states prevent cached user objects or late verification from granting route access.
- Login/logout/refresh controls and all messages are typed Arabic/English, using existing brand assets, tokens, native semantic controls, visible focus and the shared Riyadh formatter.
- The browser Auth state exposes only verified user ID/email and expiry; it never derives application permissions from user metadata. Real account authorization/MFA remains 3C.2.

## Local development

The existing demo continues with its normal command and needs no Auth configuration:

```powershell
npm run dev -- --host 0.0.0.0
```

Do not start another server on 5173 if the existing preview is running. Connected development runs separately:

```powershell
npm run dev:connected
```

With missing or unsafe configuration, the connected preview displays a bilingual configuration error and provides a separate Demo link. It does not fall back to demo accounts or mount operational screens.

The ignored `.env.connected.local` accepts only the local API and a public publishable/legacy anon key:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local public publishable or anon key>
```

Never add service-role keys, signing secrets, passwords or hosted URLs. The Vite configuration disables automatic environment exposure and defines only sanitized mode/local-URL/public-key values. Privileged/malformed key values are omitted before browser compilation; runtime validation also fails closed. Auth requests cannot redirect or target another origin; only local /auth/v1 endpoints are enabled by this milestone.

`npm run auth:fixture` creates one generated fictional, confirmed `example.invalid` Auth-only test identity, without a profile or application role. A trusted Node-only helper reads existing local CLI credentials into memory and uses the local admin API; it does not expose those credentials to React. The generated password is stored only in ignored `local-data/auth-preview-account.local.json`, and only the public key enters the ignored connected environment file. The command refuses to replace existing fixture/configuration files. It is test setup, not account-management UI or 3C.2 provisioning. One local preview fixture has been prepared and successfully tested on HOME. Read that existing local file to test login; do not recreate or publish it.

Connected persistence uses `vs.connected.auth.v1` and owned auxiliary keys. Logout clears only that namespace. Demo records, demo entry, locale and theme are not cleared; connected origin preferences are separate from the existing demo origin. No browser-wide clear or automatic data import occurs.

## Verification

Commands:

```powershell
npm test
npm run test:auth
npm run test:db
npm run check
npm run build:connected
node scripts/check-client-bundle.mjs dist-connected
powershell.exe -NoProfile -File scripts/test-sync-workflow.ps1
```

Actual HOME results on 28 October 2026:

| Check                               | Result                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Real local Auth integration         | **13 passed, 0 failed, 0 skipped**                                                                                                             |
| Unit/application suite              | **41 passed, 0 failed**, including all 36 existing cases                                                                                       |
| Existing PostgreSQL regression      | **20 passed, 0 failed, 0 skipped**; no reset or migration changes                                                                              |
| Workflow regression                 | **20 passed** from byte-identical isolated scripts; no workflow source changes                                                                 |
| npm run check                       | Formatting, Oxlint, unit/application tests, TypeScript, default build and credential scan passed                                               |
| Connected build and credential scan | Passed; no private keys, non-public JWTs or preview fixture password in either browser bundle                                                  |
| Local schema lint                   | No schema errors, empty warning-level results                                                                                                  |
| Preservation                        | Eight enabled/forced-RLS tables and contents, migration versions, cluster/volume and original API/PostgreSQL/REST identities/bindings verified |

Browser verification used the real local preview account: incorrect password displays a generic error; successful email/password login reaches the verified workspace; reload and a second tab restore the session; manual refresh succeeds; sign-out propagates to the second tab; protected `/workspace` and reload return to `/login` after logout. A connected `/dashboard?role=admin` request stays inside the session-only route boundary. The independent demo still opens its original Admin/Employee entry. Missing/unsafe configuration and default-demo isolation are covered by configuration tests and the earlier browser check; no storage was cleared.

English desktop/light and Arabic RTL mobile/light/dark views were checked using the existing brand/tokens. At 390px, the authenticated mobile panel and actions fit within the viewport without horizontal overflow; viewport screenshots were visually inspected. Full-page capture in this browser produced a clipped raster despite correct DOM bounds, so mobile evidence uses viewport captures. Screenshots remain ignored/local under `artifacts/network-security/`. No real-device, Safari/Firefox or exhaustive accessibility certification is claimed.

Historical failures are resolved: the pre-approval suite stopped on the disabled email provider. The first post-repair run exposed one expired-token fixture that assumed HS256 although the existing local user signer is ES256. The fixture now uses the existing local signing key only in Node memory and first proves that its unexpired control token is accepted, then verifies an actually expired token is denied. No signing keys were changed. The final run passed all 13 cases.

The real Auth suite creates a unique fictional fixture, deletes only that fixture afterward, and tests official-client login, denied signup/anonymous access, invalid credentials, restored/rotated sessions, expired/tampered tokens, logout, network failures, stale verification, demo-storage isolation and denial of operational access despite forged admin metadata. It does not create application account_access rows, enroll MFA or implement shipment adapters. The preview fixture is deliberately separate and retained for manual local checks. Test helpers never print CLI credentials or signing material and are never imported by browser source.

## Remaining approval boundary

Phase 3C.1 is complete for review; it is not a production authentication certification or a connected shipment milestone. Keep PR #9 Draft until the project manager reviews it and grants separate merge approval. Real protected Admin/Employee accounts, MFA and HTTP application-authorization acceptance belong to Phase 3C.2; PostgreSQL shipment adapters and cross-device operational persistence follow later approved milestones. The broader [Phase 3C plan](phase-3c-implementation-plan.md) is unchanged. Default Demo Mode remains fully available while those slices are developed and tested.

Build artifacts, environment files, passwords, tokens, raw logs, private backups and container snapshots remain ignored. No production service, external email, public website change, deployment or PR merge is performed.
