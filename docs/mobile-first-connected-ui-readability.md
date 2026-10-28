# Mobile-first connected UI readability — owner-approved follow-up

**Owner decision: 28 October 2026.** Phase 3C.5 has been explicitly accepted and PR #14 merged to `main` at verified commit `ed4b8f0649b7e05e7c9f69865ee740529f85094d`. The owner inspected three retained fictional records in operational reports (one completed, one pending, one overdue), tested daily preview and approved the milestone. They **explicitly request font/readability, desktop width/table layout and especially employee mobile usability fixes** as an immediate, dedicated follow-up. This is an implementation authorization for UI improvements only, **not** approval to merge an untested follow-up PR.

## Visual evidence described by owner
- Desktop Arabic operational reports looked overly tiny at a wide viewport: captions, field labels, table/sidebar text, controls and secondary information are hard to read. Cards occupy about two columns, with significant unused whitespace on the left; admin shipment register previously required an intrusive horizontal scroll at desktop width. Optimize actual CSS at **100% browser zoom**; do not prescribe zoom as the solution.
- Existing AR RTL branding, cyan buttons, shipment color/status labels and semantic information hierarchy are liked. Maintain it, avoiding a redesign.
- Critical priority: **employee/field-representative workflow on MOBILE phones**; users create/update/complete shipments predominantly on handheld devices. Desktop admin reports are second priority.

## Acceptance requirements

### Priority 0 — real mobile employee workflow
- Test connected login/session, employee shipment dashboard, create, form validation, edit/reload draft, completion-time picker, reopen, details/history, phone link, alerts, operational reports/filters and CSV button, account switching/logout. Admin MFA, navigation drawer, create/restore/soft-delete, admin reports and daily preview must also remain usable on phones.
- Viewports at **320, 360, 375, 390, 430 CSS px**, tablet 768 and 1024, desktop 1280/1440/1920; natural scroll and zoom 100% and 200%. Test both Arabic RTL and English LTR, light/dark and real keyboard/touch focus flows.
- No viewport or document-level horizontal overflow, clipped text, overlapping status/chips/buttons, tiny tap targets, blocked form actions or reliance on hover. Do not conceal accidental overflow with `overflow-x:hidden`. For wide data tables, use real mobile card presentation and a legible desktop layout; keep shipment identities and actions visible.
- Aim for **>=44×44 CSS px touch targets** where practical, readable 16px or larger body, minimum ~14px secondary labels and 16px mobile inputs/selects/textareas (no iOS auto-zoom). Use sensible scalable rem/em values and line-height; allow browser text zoom, preserve wraps/Arabic ligatures and long bilingual words. Do not use fixed viewport pixel heights/widths that break text.
- Prioritize single-column shipment forms/cards and predictable visible primary actions on mobile. Keyboard open/soft keyboard must not hide Save/Cancel/Complete controls. Confirm dialogs fit viewport and scroll internally where necessary; ensure focus returns appropriately.

### Priority 1 — desktop report/register and typography cleanup
- Raise contrast/size of report filters, date/help labels, sidebar items, TR IDs, statuses and footer; improve spacing and hierarchy, reduce vast dead space, keep report filters compact with clear Apply/Clear actions. Consider proportional card layout and max width to avoid unreadably long lines on ultrawide screens.
- Admin **shipment table** must not require horizontal scroll at ordinary desktop width such as 1280 CSS px. Use sensible grid/column widths, wrapping or progressive disclosure on tablet; **do not remove key data**, use a detail link. Mobile shows cards. Check operational report grids and daily preview.
- Preserve color/status meaning by text + icons, not color alone; maintain visible focus styles, semantic headings, aria labels, proper RTL ordering.

### Safety and testing
- **Change only connected presentation/layout components and styles, plus narrowly necessary tests/docs.** No migrations, Supabase policies/roles, auth changes, code refactor, new business features, email/scheduler, production/deployment, default mode switch or broad design refresh. Preserve default Demo visuals and workflows at 5173 and Connected data/security at 5174.
- Owner expressly approved and wants **three new retained fictional QA shipments to remain**: `TR-0548` completed yesterday (A), `TR-0549` overdue (B), `TR-0550` pending today (admin). **Do not delete, edit, reset, or recreate these**, their audit/events/receipts or any existing data. No more fixtures without a new scoped authorization. Leave Docker, local DB and six applied migrations untouched.
- Read HOME git state first; fetch and safely switch from 3C.5 candidate to existing `feature/mobile-first-connected-ui-readability` (based on verified merged main) without discarding work. Stay with existing local Supabase services and Vite previews; avoid duplicate listeners.
- Browser acceptance screenshots or documented measurements: every viewport above, AR/EN dark/light, employee and admin navigation, create/edit/complete, report filters/CSV, load/empty/error states, distinct touch targets, zero document horizontal overflow; verify the actual retained rows via **read-only** account sessions.
- Run existing Auth/security/DB/application/workflow suites, format/lint/TypeScript, builds and bundle scans; add narrow UI regression tests if appropriate. No invented test evidence. Do not log local passwords, tokens, MFA, backup filenames or customer data.
- Update this handoff and `docs/PROJECT_STATUS.md`, push only source and test evidence summary to existing branch, verify remote SHA and PR, then **STOP for project-manager/owner visual review; DO NOT MERGE the follow-up PR**.

### Final review gate
Open a *visible* Brave window on the owner's HOME desktop showing the **modified Connected candidate** dashboard and reports at `http://127.0.0.1:5174/`; owner will inspect mobile simulation or their own device after local preview. Note: HOME localhost cannot be accessed directly from a separate phone without additional approved networking; **do not expose ports or create tunnels** as a workaround.
