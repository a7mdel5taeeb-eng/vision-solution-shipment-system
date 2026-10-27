# Vision & Solution — Project Instructions

## Source of truth and Git workflow

- The private GitHub repository `a7mdel5taeeb-eng/vision-solution-shipment-system` is the single source of truth. `main` is the stable branch.
- Before work: confirm repository and branch, inspect `git status`, fetch `origin`, and ensure the work is based on the appropriate remote revision. Never discard, overwrite, or force-push local work.
- Create one focused feature branch per approved phase. Run the relevant checks, review changes for secrets, commit, push, verify the remote branch, and report the branch and commit hash.
- Do not merge to `main`, force-push to `main`, deploy, or start a new phase without explicit user approval. Before moving between computers, commit and push transferable work; on the next computer, fetch and safely synchronize first.

## Product boundaries and architecture

- This is a React 19 + TypeScript + Vite browser-local prototype. Preserve the current architecture: domain rules in `src/features/shipments/model.ts`, local persistence in `src/app/demo/`, shared Riyadh utilities in `src/shared/lib/dates.ts`, typed messages in `src/shared/i18n/`, and role-aware routing in `src/app/router.tsx`.
- Do not rebuild approved UI/UX or change official Vision & Solution branding, the company website, production hosting, DNS, databases, email delivery, or external services.
- Keep Arabic and English equally supported, including RTL/LTR behavior, Arabic typography, labels, errors, and phone input. Use existing tokens, translations, logical CSS properties, and accessible primitives.

## Approved workflow and roles

- Shipment IDs are automatic and never reused. A saved shipment gets its start time automatically; completion time is manually entered in Asia/Riyadh time.
- Open shipments are Pending through exactly 96 hours and Overdue strictly after 96 hours. Completed records stay Completed; reopening retains the original start time. Deleted records are soft-deleted and excluded from active reports.
- Employees may work only with their own shipments; they may not delete shipments or access administrator-only pages. Administrators may manage all shipments, soft deletion/restoration, reports, alerts, users, and daily-report recipients. These are prototype checks, not production security.
- The daily report preview covers the previous Riyadh calendar day’s starts/completions and all currently open overdue shipments. It displays the planned 08:00 Asia/Riyadh delivery but must never send email.

## Engineering and safety standards

- Make focused, maintainable changes and avoid speculative refactors or unapproved dependencies. Use available, verified specialist skills when applicable.
- Retain native semantic controls, keyboard navigation, visible focus, labels, useful errors, adequate contrast, and non-colour status cues. Test responsive behavior after UI changes.
- Run `npm run check` for every completed phase; add or update focused tests for changed domain behavior. Perform browser-based checks when available.
- Never commit credentials, keys, local data, personal data, generated build output, or sensitive logs. No production auth, authorization, storage, email, or scheduling is to be connected until explicitly approved for Phase 3.
