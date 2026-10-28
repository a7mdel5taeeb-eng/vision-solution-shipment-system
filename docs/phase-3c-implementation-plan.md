# Phase 3C — proposed local Auth and database integration

**Current progress — 28 October 2026:** the planning history below is preserved. Milestones 1–3 and the HTTP 404 fix are approved/merged at main `3497b2fbaa166fa9858712558adc9641f8a8d912`. The owner approved milestone 4 implementation on existing `feature/phase-3c4-connected-shipment-commands`, Draft PR #13; see [the command candidate and actual results](phase-3c4-connected-shipment-commands.md). Milestone 5 still requires separate approval. No service restart was performed for milestone 4; persistence was verified through reloads, independent clients and PostgreSQL/audit queries while preserving running containers. Old entry-gate language below is historical, not an instruction to repeat completed infrastructure or PR integration.

**Original planning below is historical.** Preserve the Phase 2.9 interface and current demo. This document does not authorize merges, later milestones, production services or deployment.

## Entry gates

1. Preserve the [approved and verified HOME localhost repair](home-localhost-repair-2026-10-27.md): explicit publishing is applied, the existing volume/data is preserved and fresh database tests passed. Existing-container Docker stop/start retained the bindings. Future CLI recreation or SCHOOL setup requires its own safe verification; do not assume the repair is a portable Supabase setting.
2. Obtain separate approval decisions for PR #5 (database foundation) and PR #6 (workflow). Reconcile their overlapping AGENTS/README instructions deliberately and rerun checks. Both are individually mergeable against the current main; that does not prove a combined integration.
3. Agree Phase 3C scope, account bootstrap/recovery rules and invoice-byte handling. Create small focused implementation branches only after approval from the resulting approved base. Never edit the applied Phase 3B migrations; append migrations for new contracts.

## Milestone 1 — isolated connected mode and real local sessions

**Scope:** add the official Supabase browser client and typed configuration in an opt-in local connected mode, while the default demo provider and its storage keys remain unchanged. The browser receives only the local public/publishable client key; privileged/service keys never enter React, Vite variables or browser bundles. Initially restrict the configured URL to the approved local endpoint; fail clearly on missing/invalid configuration.

Add sign-in, sign-out, refresh/expiry handling and protected-route loading states within the existing branded shell. The initial Admin/Employee concept remains; in connected mode a role choice is navigation intent only. Actual privileges come from protected backend account data. Named demo accounts and unrestricted demo switching remain confined to demo mode. Use a separate local preview origin/profile and session/cache namespace to compare modes without changing existing browser-local records. No automatic demo-data import or seed/reset.

**Tests:** valid/invalid password sign-in through real local Auth; reload/refresh; expired and tampered tokens; logout and route rejection; missing configuration; mode/cache separation; bundle scan for privileged keys. Use fictional test identities and generated credentials kept in memory/ignored local state. No outbound email, public signup or production accounts.

**Acceptance:** default demo behaves exactly as before; an authenticated local test user survives reload; logout clears that user's connected session/data cache; the demo role selector cannot grant backend rights. UI labels/errors support Arabic and English. No shipment operations are connected yet.

## Milestone 2 — protected accounts, administrator MFA and HTTP authorization

**Scope:** provide a narrowly scoped self-access/profile read contract and a local operator bootstrap for fictional admin/employee accounts. Protected account_access remains the authority; user metadata, editable profiles and browser role values cannot change roles. Account creation uses a trusted local operator path, never an exposed browser service key. Keep signup disabled.

Implement administrator TOTP enrollment/challenge and the AAL2 gate. Authenticated administrator AAL1 sessions may complete MFA onboarding but must not read operational data or execute administrator commands. Agree recovery procedures before enabling recovery actions. Add narrowly authorized account activation/deactivation/role commands and audit events only if included in the approved slice; protect the last active administrator with a concurrency-safe server check. New SQL functions must revoke default PUBLIC execution within their migration transaction and receive only necessary grants.

**Tests:** real signed employee A/B and administrator tokens over HTTP; admin before/after MFA; anonymous, expired/tampered, missing-profile and inactive users; metadata-role forgery; guessed shipment/history IDs; direct table writes; denied actions leave no mutation/audit artifact. Test live deactivation and last-admin races if account commands are approved. Keep the existing SQL integration suite too.

**Acceptance:** employee A cannot access B's records even with direct REST/RPC requests; admin requires real AAL2; backend denial holds when React routing is bypassed. This closes the current gap between synthetic SQL-claim tests and actual Auth/PostgREST enforcement. Follow [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa) and [Data API grants/RLS guidance](https://supabase.com/docs/guides/api/securing-your-api).

## Milestone 3 — typed shipment reads through an adapter

**Scope:** introduce a small repository interface implemented separately by the existing demo and the connected client. Keep domain validation, translations, date helpers, cards, tables and forms reusable; do not rewrite the app or add a new UI framework.

Map UUID identity separately from TR display numbers. Preserve bigint number/revision fields as strings. Map optional phone, invoice number and notes without truncation or format loss. Fetch authorized list/detail/history records; add explicit validated query contracts for search, filters, pagination and counts rather than downloading an unbounded full table. Reuse existing RLS and invoker reads. Never use service credentials to obtain administrator-wide rows. Clear connected caches when the session/role changes, and handle disabled accounts and unavailable records without leaking their existence.

**Tests:** A/B/admin lists and direct detail routes; pagination and counts; Unicode/Arabic search; UUID/display ID mapping; bigints above JavaScript's safe integer range; missing/denied records; loading/error/empty states; session-switch cache isolation. Compare shapes with the same component-level expectations used by the demo.

**Acceptance:** employee dashboard shows only owned shipments; administrator sees all authorized shipments including the separately protected deleted register. Existing visual hierarchy, routes, RTL/LTR and phone presentation are retained. Demo records stay untouched.

## Milestone 4 — transactional shipment operations

**Scope:** connect creation, editing, completion/time editing, reopening and administrator-only soft deletion/restoration to public.shipment_command. Use the server-created owner, UUID, number and start time. Preserve manual Riyadh completion entry through existing UTC conversion. The server read contract remains the authority for the strictly-greater-than-96-hour status.

Send the expected revision and a per-intent idempotency UUID. Retries of an uncertain request reuse the same key/payload; a new user intent gets a new key. Do not auto-overwrite a colleague's conflicting edit. Refetch the authorized current record after a successful command rather than displaying a stale retry receipt. Preserve unsaved form values and show useful bilingual conflict/denial/validation errors. Reuse existing confirmation dialogs and non-colour status cues.

**Tests:** every command with employee A/B and admin AAL1/AAL2 through the HTTP API and browser; forged owner/start/number; cross-owner edits; employee deletion; duplicate network retries; simultaneous creates; stale revisions; invalid dates; exact 96-hour boundary; reopening; audit actor/action/revision; soft delete/restore; optional phone/Unicode. Verify failed requests create no partial mutation or event.

**Acceptance:** operations persist after reload and database service restart without reset; numbers are not reused; original owner/start remain immutable; history is atomic; employee deletion is denied in the backend even if a control is manually invoked.

## Milestone 5 — complete connected workflows and persistence acceptance

**Scope:** finish connected admin/employee dashboards, overdue alerts, authorized reports and daily preview using backend data consistently. Reports must preserve Riyadh calendar boundaries, deleted-record exclusion, role scoping and formula-safe export. Keep the daily report as a preview only; no scheduler/SMTP.

Exercise the same backend from two independent browser profiles/sessions: creation in one appears in another authorized session, ownership remains isolated, admin can see both, and concurrent edits return a conflict. Test offline/error recovery without treating a failed network write as saved. Preserve Arabic/English typography, keyboard focus, mobile/desktop layouts and the approved branded components. Use Impeccable selectively for consistency/accessibility review after approved UI edits, without a redesign.

**Tests:** end-to-end two-session workflows; restart/reload persistence; role/session changes; reports and CSV; daily preview boundaries; AR/EN, RTL/LTR, light/dark, keyboard and responsive layouts; unchanged demo regression suite; database/HTTP tests; TypeScript, lint, formatting and production build. Document remaining failures explicitly.

**Acceptance:** the local connected version passes the complete agreed workflow matrix before it is considered for default use. The demo remains available and the default is changed only with approval. Reverting the mode never deletes browser or database records.

## Explicit boundaries and decisions

- **Across physical devices:** GitHub synchronizes code, not local PostgreSQL data. Two local browser profiles demonstrate shared-backend persistence, not HOME/SCHOOL data sharing. Actual physical cross-device use needs a separately approved shared non-production backend or an explicitly approved protected network/tunnel. Localhost hardening must not be undone silently; no staging/production service is provisioned by this plan.
- **Invoice image bytes:** Phase 3B stores metadata only. It has no private upload/finalization/download contract. Do not put existing data URLs in database commands or pretend an image was saved. Keep demo images working. Either approve a separate private-storage milestone with policies/byte validation or clearly leave image upload unavailable in the connected pilot; decide before calling connected workflow acceptance complete. Invoice number/notes/phone are in scope.
- **Account administration/recovery:** agree who creates/deactivates accounts, prevents last-admin loss and handles MFA/password recovery. No live invitations, email provider or company credentials are authorized.
- **Security scope:** SQL/HTTP/browser tests complement each other. Local success is not production clearance. Retention, region/residency, RPO/RTO, backup restoration and operating budget remain separate decisions.
- **Delivery:** one small reviewable slice at a time; update PROJECT_STATUS, run the relevant tests, review for secrets, push only approved changes, verify remote hashes and await approval before merges or a broader phase.

The proposed order is sessions → protected accounts/MFA/HTTP security → reads → commands → complete workflow acceptance. No milestone code, Auth account, migration, deployment or production connection is created by this planning document.
