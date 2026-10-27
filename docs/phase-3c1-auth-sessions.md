# Phase 3C.1 — local Auth sessions

**Implementation checkpoint; not ready for merge.** Branch `feature/phase-3c1-auth-sessions`, existing draft PR #9. Phase 3B is approved/merged as `7aaebaf608b2e09211c51a25d2974e47ae80aa71`. Phase 3C.2 and later remain out of scope.

## Current verified blocker

The existing local Auth service returns `email_provider_disabled` and its actual `GOTRUE_EXTERNAL_EMAIL_ENABLED` is false. No successful login/session claim can be made until that local setting is corrected and real Auth tests pass. An explicit request for a narrow Auth-container replacement exception to PR #9's recorded no-recreation scope is pending. No Auth container, API container, database container, volume or migration has been changed by this checkpoint.

The proposed fix preserves the exact Auth image/keys/network address and retains its original stopped container for rollback. Only local email/password login would be enabled; global public signup, anonymous sign-in, SMTP and external providers remain disabled. Private Auth configuration and a fresh PostgreSQL backup have been prepared under ignored artifacts, and backup hashes matched the container bytes. Do not run generic Supabase stop/start or reset the database to enable this provider. See [official Docker Auth configuration](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml) for the separate email-provider and global-signup flags. Runtime changes await the owner decision.

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

`npm run auth:fixture` creates one generated fictional, confirmed `example.invalid` Auth-only test identity, without a profile or application role. A trusted Node-only helper reads existing local CLI credentials into memory and uses the local admin API; it does not expose those credentials to React. The generated password is stored only in ignored `local-data/auth-preview-account.local.json`, and only the public key enters the ignored connected environment file. The command refuses to replace existing fixture/configuration files. It is test setup, not account-management UI or 3C.2 provisioning. One local preview fixture has been prepared on HOME; it cannot currently sign in while the provider is disabled.

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

Actual checkpoint evidence:

- Unit/application suite: 41/41 passed, including all 36 existing cases plus local configuration/public-key filtering and storage isolation.
- Existing database regression: 20/20 passed, no reset or migrations applied.
- Existing workflow regression: 20/20 passed from byte-identical isolated scripts, avoiding the previously recorded Windows preview-checkout fixture lock.
- TypeScript and lint passed. Both default and connected builds passed; both browser bundles passed private-key/non-public-JWT/fixture-password scans.
- Browser: missing configuration fails closed; connected protected path returns to login; Arabic RTL mobile at 390px has no horizontal overflow; English desktop/light and Arabic/dark states use the approved visual system; provider-disabled error is actionable and passwords clear after submission.
- The initial real-Auth run recorded 11 failures and 1 passing negative case because email login was disabled. This is not successful session verification. The error mapping now identifies provider-disabled separately from invalid credentials, and the suite now checks service settings first rather than repeating doomed login attempts. The latest rerun reports 0 passed/12 failed at that shared prerequisite; these are blocked session cases, not passing authentication verification. Successful login, persistence/refresh, expiry, logout, race and signed-token assertions remain unverified pending the approved local fix.

The real Auth suite creates a unique fictional fixture, deletes only that fixture afterward, and tests official-client login, invalid credentials, restored/rotated sessions, expired/tampered tokens, logout, network failures, stale verification, demo-storage isolation and denial of operational access despite forged admin metadata. It does not create application account_access rows, enroll MFA or implement shipment adapters. The preview fixture is deliberately separate and retained for manual local checks.

Build artifacts, environment files, passwords, tokens, raw logs, private backups and container snapshots remain ignored. No production service, external email, public website change, deployment or PR merge is performed.
