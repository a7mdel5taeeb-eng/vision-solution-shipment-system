# Vision & Solution TMS — Phase 4 release-readiness planning

> **OWNER-APPROVED PHASE 4B POLICY — 29 Oct 2026:** Up to **3 available invoice images per shipment**; **3 MiB (3,145,728 bytes) maximum per image**, JPG/JPEG/PNG/WebP only, PDF and HEIC/HEIF unsupported. Employees upload/replace ONLY their own images, admin AAL2 may logically detach. This updates the SCHOOL planning assumptions in [the reviewed attachment design](phase-4b-secure-invoice-attachments-plan.md). The original schema supports only ONE 750 KiB image, so code must not be assumed ready and will require a forward-only reviewed security/storage migration. **Planning approval only; no database, implementation, migration, deployment or PR merge authorized.**

**Status: PLANNING / SCHOOL-SAFE HANDOFF ONLY — 29 October 2026.**
Owner explicitly approved merging mobile-first Connected UI PR #15. Verified `main` merge SHA: `ee23364be40236c37e37d6cd73e92014fbddd7d4`. The new planning branch is based on that exact merge; **no Phase 4 application code, migrations, tests or deployment are authorized by this planning artifact**. Owner is moving from the HOME Windows computer to SCHOOL and may shut HOME down. The approved connected app remains a HOME local instance until separate hosting decisions are made.

## Approved development baseline and immutable local records

- Phase 3C.1–3C.5 and mobile-first UI are merged. React/Vite + Supabase Auth/PostgREST/PostgreSQL, signed role/AAL2 security, transactional `shipment_command`, read-only reporting, daily preview (NOT scheduled/sent), and separate Demo at 5173 / Connected at 5174 are implemented locally.
- Owner-retained fictional QA records **TR-0548, TR-0549, TR-0550** exist in HOME's local PostgreSQL and **must not be modified, deleted, recreated or assumed to exist on SCHOOL**. Source code on GitHub does **not** include these rows, Auth accounts, TOTP factors, local env, backups or browser sessions.
- PR #15 Codex HOME reported 30 signed HTTP, 13 Auth, 20 DB, 74 app, 20 workflow tests; local browser viewport matrix; no hosted CI was reported. Owner explicitly approved merge, **not** production or real physical iOS/Android acceptance.
- Do not reset, stop/recreate or reconfigure the retained HOME Docker stack, copy secrets through GitHub, or invent a shared environment.

## Proposed prioritized release roadmap — requires owner's selection and new implementation approval

### 4A. Requirements / security / operating agreement (SCHOOL-SAFE FIRST)
- Confirm with owner/customer: expected shipment/month and users, single company/multiple branches, who owns Vercel/Supabase/domain, invoicing policy, attachment types/size/quota/retention, admin/recovery processes, daily email recipients and opt-in requirements, outbound sender domain, hosting region/data residency and budget, SLAs/backup RPO-RTO, Saudi PDPL/privacy/compliance review and handover/licensing.
- Design a data flow / threat model for mobile browser → Vercel frontend → Supabase Auth/RLS/Postgres/Storage, server-side email worker and auditing; explicitly exclude the service-role key from browser bundles.
- Produce a customer-facing implementation/acceptance checklist, staged rollout and rollback plan; separate existing MVP from promised **Business Plus** features not yet implemented.
- Do not treat commercial proposal estimates as signed customer acceptance, fixed provider prices or cloud deployment authorization.

### 4B. Invoice images and shipment attachments (NOT IMPLEMENTED)
- Decide storage-provider/region, private buckets, signed read/upload contracts, MIME validation, size/quantity limits, anti-malware/process policy, per-shipment owner/admin AAL2 restrictions, encrypted transport/storage, durable download access, retention/deletion and audit.
- Add the minimal forward-only backend schema/storage policies only after owner-approved plan and database backup. Test employee A/B horizontal isolation, disabled user and admin AAL1/AAL2, original filename/path traversal, guessed object keys, oversize, tampered tokens, orphan cleanup and lifecycle. No public buckets.
- Distinguish invoice number currently implemented from actual **invoice image files**.

### 4C. Daily report email scheduler (NOT IMPLEMENTED)
- Existing `/daily-report` is a manual preview only. Define recipients, time (08:00 Asia/Riyadh), report period (prior Riyadh calendar day), idempotent execution, retry/backoff, rate/bounce handling, confidentiality, disable/pause controls and error monitoring.
- Choose a trusted server-side scheduler/worker and approved mail provider; no mail API secrets in React. Only run real outbound tests with customer opt-in and confirmed recipients.
- Verify clock/DST assumptions, no duplicate sends across retries and role-scoped aggregation independent of ordinary browser sessions.

### 4D. Account administration and recovery (NOT IMPLEMENTED)
- Implement only after approval: invite/provision/deactivate employees, audited role changes, last-admin protection, MFA lost-device recovery with out-of-band identity verification, session revocation and documented break-glass policy.
- No unverified public signup, bypassing AAL2, exposing passwords/TOTP, or resetting retained fictional identities.

### 4E. Cloud staging, deployment and operations (NOT IMPLEMENTED)
- Separate staging and production projects, private production migrations, backups/PITR/restore drills, encrypted secrets, least privilege, monitoring/alerts, CI security and release gates, browser E2E across real phones, acceptable mobile coverage, load/backup testing, incident response, and documentation.
- Proposed destination `system.vsolutions.co` is distinct from the company's marketing site. **Do not touch DNS, Vercel deployments, Supabase cloud, domains, payment or subscription plans before separate owner approval.**
- Confirm exact Vercel/Supabase costs/limits at purchase time; recurring bills belong to designated account owner. No claims that HOME and SCHOOL automatically share the database.

## Moving from HOME to SCHOOL safely (29 October)

1. On HOME if possible before shutdown: check `git status --short --branch`; report any uncommitted files, do not wipe/reset/stash blindly. **PR #15 is already pushed and merged**, so code is safely in GitHub. HOME can be powered down after existing services close normally; do not run generic Supabase stop or Docker cleanup.
2. On SCHOOL, open existing checkout only after inspecting `git status --short --branch` and origin/worktrees. Run `git fetch origin --prune` safely. Never `git reset --hard`, `git clean`, overwrite ignored config or assume the SCHOOL DB matches HOME. If checkout has work, stop and ask for a safe reconciliation.
3. SCHOOL is suitable for read-only GitHub/code review, documentation/diagrams, source-level UI work and Demo preview (5173) without real HOME records. Connected 5174 tests require independently prepared, safe, authorized local Supabase and accounts; **do not set one up merely for this planning task**.
4. This PR should remain **Draft / unmerged**; ask owner to choose Phase 4 priority and constraints before implementing any of 4B–4E.

## Candidate acceptance gates

- Requirements signed off and responsibilities/hosting pricing transparent.
- Mobile staff can complete end-to-end on real Android/iPhone, independent admin/employee authorization tested against a non-production staging backend.
- Invoice uploads, if included, proven private with strict tenant/owner isolation and storage retention.
- Daily delivery, if included, scheduled with proof of idempotent execution and approved recipients.
- Independent secure onboarding/recovery, backups, monitoring, cloud staging, formal customer acceptance before commercial production.
