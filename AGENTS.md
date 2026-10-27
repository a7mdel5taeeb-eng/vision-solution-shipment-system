# Vision & Solution — Project Instructions

## Source of truth and Git workflow

- The private GitHub repository `a7mdel5taeeb-eng/vision-solution-shipment-system` is the single source of truth. `main` is the stable branch.
- Before work: confirm repository and branch, inspect `git status`, fetch `origin`, and ensure the work is based on the appropriate remote revision. Never discard, overwrite, or force-push local work.
- Create one focused feature branch per approved phase. Run the relevant checks, review changes for secrets, commit, push, verify the remote branch, and report the branch and commit hash.
- Do not merge to `main`, force-push to `main`, deploy, or start a new phase without explicit user approval. Before moving between computers, commit and push transferable work; on the next computer, fetch and safely synchronize first.

## Product boundaries and architecture

- This is a React 19 + TypeScript + Vite browser-local prototype. Preserve the current architecture: domain rules in `src/features/shipments/model.ts`, local persistence in `src/app/demo/`, shared Riyadh utilities in `src/shared/lib/dates.ts`, typed messages in `src/shared/i18n/`, and role-aware routing in `src/app/router.tsx`.
- Do not rebuild approved UI/UX or change official Vision & Solution branding, the company website, production hosting, DNS, databases, email delivery, or external services.
- Phase 2.9 is the officially approved frontend baseline. Preserve its Admin/Employee landing page, separate dashboards, shipment workflows, bilingual support, Impeccable configuration and accessibility improvements. No major UI redesign is authorized. Phase 3A architecture is approved; Phase 3B permits a separate local database foundation, migrations and tests only. Connecting the application, production provisioning and deployment require separate approval.
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
- Database work lives in `supabase/migrations/`; never edit an applied migration on a shared environment. Run `npm run test:db` separately against the dedicated local Supabase PostgreSQL container. Do not claim RLS is verified from static inspection, mocks or frontend tests. Preserve demo persistence; do not link/push/reset a hosted database or import local operational data. Never reset/purge an existing database without explicit authorization; disposable databases created for the current test run may be recreated only after confirming no existing user data is present. Production access requires separate approval.
- Never commit credentials, keys, local data, personal data, generated build output, or sensitive logs. No production auth, authorization, storage, email, or scheduling is to be connected until explicitly approved for Phase 3.
