# Vision & Solution — Project Instructions

## Source of truth and Git workflow

- The private GitHub repository `a7mdel5taeeb-eng/vision-solution-shipment-system` is the single source of truth. `main` is the stable branch.
- Before work: confirm repository and branch, inspect `git status`, fetch `origin`, and ensure the work is based on the appropriate remote revision. Never discard, overwrite, or force-push local work.
- Create one focused feature branch per approved phase. Run the relevant checks, review changes for secrets, commit, push, verify the remote branch, and report the branch and commit hash.
- Do not merge to `main`, force-push to `main`, deploy, or start a new phase without explicit user approval. Before moving between computers, commit and push transferable work; on the next computer, fetch and safely synchronize first.

## Product boundaries and architecture

- This is a React 19 + TypeScript + Vite browser-local prototype. Preserve the current architecture: domain rules in `src/features/shipments/model.ts`, local persistence in `src/app/demo/`, shared Riyadh utilities in `src/shared/lib/dates.ts`, typed messages in `src/shared/i18n/`, and role-aware routing in `src/app/router.tsx`.
- Do not rebuild approved UI/UX or change official Vision & Solution branding, the company website, production hosting, DNS, databases, email delivery, or external services.
- Phase 2.9 is the officially approved frontend baseline. Preserve its Admin/Employee landing page, separate dashboards, shipment workflows, bilingual support, Impeccable configuration and accessibility improvements. No major UI redesign is authorized. Phase 3A architecture is approved and merged. Phase 3B is an isolated local database candidate in PR #5 awaiting merge approval; its implementation is not part of this maintenance branch. Phase 3C and application/backend integration require separate approval.
- Keep Arabic and English equally supported, including RTL/LTR behavior, Arabic typography, labels, errors, and phone input. Use existing tokens, translations, logical CSS properties, and accessible primitives.

## Approved workflow and roles

- Shipment IDs are automatic and never reused. A saved shipment gets its start time automatically; completion time is manually entered in Asia/Riyadh time.
- Open shipments are Pending through exactly 96 hours and Overdue strictly after 96 hours. Completed records stay Completed; reopening retains the original start time. Deleted records are soft-deleted and excluded from active reports.
- Employees may work only with their own shipments; they may not delete shipments or access administrator-only pages. Administrators may manage all shipments, soft deletion/restoration, reports, alerts, users, and daily-report recipients. These are prototype checks, not production security.
- The daily report preview covers the previous Riyadh calendar day’s starts/completions and all currently open overdue shipments. It displays the planned 08:00 Asia/Riyadh delivery but must never send email.

## Engineering and safety standards

- Make focused, maintainable changes and avoid speculative refactors or unapproved dependencies. Use available, verified specialist skills when applicable.
- On a new Windows checkout, run `scripts/setup-impeccable.ps1` to recreate the approved project skill and hook, then verify with `-CheckOnly`. Respect `.impeccable/toolchain.json`; never silently upgrade or force-replace an existing installation. Keep generated skills, native binaries, local consent, and hook runtime files ignored.
- Use Impeccable for approved typography, layout, accessibility, consistency, responsiveness, and component polishing. Honor the shared code-first default and `PRODUCT.md`; comp-first concepts require explicit user approval. An audit documents findings without changing the approved UI.
- Retain native semantic controls, keyboard navigation, visible focus, labels, useful errors, adequate contrast, and non-colour status cues. Test responsive behavior after UI changes.
- Run `npm run check` for every completed phase; add or update focused tests for changed domain behavior. Perform browser-based checks when available.
- Never commit credentials, keys, local data, personal data, generated build output, or sensitive logs. No production auth, authorization, storage, email, or scheduling is to be connected until explicitly approved for Phase 3.

## Permanent HOME / SCHOOL continuity

- `docs/PROJECT_STATUS.md` is the central status reference. Read it at the start of every session; distinguish approved stable work, unmerged candidates, historical evidence and tests executed on this computer. An absent file on an older branch is not permission to recreate or merge unrelated work.
- Start: read status, inspect Git status, verify the application repository and approved branch, fetch origin, check local changes/divergence, safely synchronize only that tracked branch, review its latest checkpoint, identify the user's approved task, then edit. Use `scripts/sync-start.ps1` when present. Never assume local files are newer than GitHub.
- Stop if local work, an unfinished Git operation, a mismatched upstream, ignored-file collision or diverged history prevents safe synchronization. Never automatically stash, switch branches, reset, clean, force-push or merge a feature into main. Review local-only commits and existing stashes/worktrees explicitly.
- End: run appropriate checks, update PROJECT_STATUS with actual results and pending approvals, review changed files and every outgoing commit for sensitive content, commit only approved explicit files, push only to the authorized development branch, verify the remote hash, and report branch/commit/PR. Use `scripts/sync-end.ps1`; commit/push switches require explicit human authorization for that session. Script flags are records of approval, not permission for an agent to authorize itself.
- Never modify main directly or merge either PR #5 or the workflow maintenance PR without explicit approval. Keep workflow changes on `chore/cross-computer-development-workflow`, based on verified stable main; do not copy unapproved database implementation into it. After workflow approval, integrate the reviewed workflow into active branches deliberately, preserving their full instructions. Until then, use the reviewed manual workflow in `docs/cross-computer-workflow.md`.
- Database work belongs in `supabase/migrations/`. Never change applied shared migrations, reset an existing database, delete volumes, or import operational data during setup. Verify the dedicated local Linux Docker context/container and inspect existing data before pending migrations. Run `npm run test:db` on the database branch; frontend tests or SQL inspection do not verify RLS. Never run hosted login/link/db-push or connect production services during this setup.
- Git transfers committed source, docs, migrations, lockfiles and shared configuration. It does not transfer installed tools, Docker volumes/PostgreSQL data, browser localStorage, secrets, running servers, machine hook consent, or local Codex conversations. Do not silently copy, delete or reset any of these.
- Stop this project's Vite process before `npm ci` only with authorized interruption and a restart plan. Use the pinned Impeccable setup script without silently upgrading/replacing installations. Ask for system elevation, Windows feature changes, restarts and any separate hook-trust prompt. Do not bypass machine security or claim setup complete while prerequisites or database tests remain blocked.
