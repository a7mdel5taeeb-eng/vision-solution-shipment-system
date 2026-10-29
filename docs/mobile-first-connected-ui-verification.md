# Connected mobile readability — HOME verification

Date: 29 October 2026. Candidate: `feature/mobile-first-connected-ui-readability`, Draft PR #15. Stable main remains `ed4b8f0649b7e05e7c9f69865ee740529f85094d`; this document does not approve merging the candidate.

## Scope delivered

- Connected and login typography uses a 16px base, 14–15px secondary text, 16px form controls and the existing Cairo/Montserrat fonts. Existing brand colors, status text/icons and focus styles are retained.
- Phone forms, routes and driver details become single-column. Long bilingual names, phone values and identifiers wrap. Primary controls have at least 44px targets; dialogs scroll within the available viewport, and their actions wrap naturally.
- The employee dashboard pairs Create and Refresh on phones and keeps search visible. Native, keyboard-operable filter disclosures reduce the space before records and reports. Optional form fields remain in their existing disclosure.
- Administrator registers use cards below 1200px. The seven-column desktop table wraps within its available width instead of requiring a 1080px minimum. At 1280px, its measured container and scroll widths are both 980px in all four language/theme combinations.
- Report filters use a responsive grid. Page content has a readable maximum width on large screens. Empty-state explanations, optional-field summaries, report owner help, history and footer text are enlarged.
- A 200% browser-zoom check found duplicate employee creation links near the phone breakpoint; the header action is now hidden consistently when the mobile primary action appears.

Only `src/styles/connected.css`, `ConnectedList.tsx` and `ConnectedReports.tsx` change runtime presentation. No dependency, query, command, Auth, business-rule, migration or Demo implementation changes.

## Actual HOME tests

| Check                                                       | Result       |
| ----------------------------------------------------------- | ------------ |
| Real signed HTTP security/authorization suite               | 30/30 passed |
| Real local Supabase Auth suite                              | 13/13 passed |
| PostgreSQL integration/RLS suite                            | 20/20 passed |
| Application/domain/adapter suite                            | 74/74 passed |
| HOME/SCHOOL workflow suite                                  | 20/20 passed |
| Formatting, lint, TypeScript and default production build   | Passed       |
| Connected production build and both client credential scans | Passed       |

The workflow tests ran against hash-verified copies of the four unchanged scripts in a disposable temporary directory, preserving the working preview. These are executed HOME results, not new hosted CI evidence. An initial formatting check found the incoming requirements document unformatted; it was formatted and the full check rerun successfully.

## Browser acceptance

The actual local Connected application was exercised at **320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 CSS pixels**, Arabic RTL/English LTR and light/dark. Checked login, employee dashboard, expanded create/edit forms, details/history, completion dialog, operational reports, administrator dashboard/register and daily preview. Browser measurements checked document width, rendered control sizes, text sizes and desktop table scroll width. Small optional-form, empty-state and administrator owner-help text discovered during testing was corrected and retested.

The final administrator dashboard/report matrix was additionally rerun after those fixes: **80 combinations, zero document horizontal overflow, zero measured controls below 44px (0.5px rounding tolerance), zero rendered main/header/sidebar/footer text below 14px**. Earlier checks covered the employee pages and completion dialogs across the same width/language/theme matrix. Hidden content and the intentionally offscreen skip link were excluded from size checks. This is targeted browser verification, not a blanket accessibility certification.

| Workflow              | Actual result                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Employee login/logout | Existing fictional Employee A logged in at 320px; logout returned to login. Brave login also passed.                                                                                     |
| Create/validation     | One authorized temporary shipment created through the Arabic phone form; empty required submission focused the customer field.                                                           |
| Edit/reload           | English phone edit draft survived reload; saved truck change persisted.                                                                                                                  |
| Complete/reopen       | Manual Riyadh completion saved, displayed in history, then reopened with original start preserved.                                                                                       |
| Details/phone         | Readable customer, route, driver, history and `tel:` link verified; no call placed.                                                                                                      |
| Dialog keyboard       | Escape closed reopening confirmation and restored focus to its trigger. A 320×480 reduced-height dialog was usable through internal scrolling.                                           |
| Employee reports      | Owned records only, filters, counts and CSV action remained available.                                                                                                                   |
| Administrator access  | Existing MFA-authorized AAL2 session displayed all authorized records and reports. No account or MFA factor changed.                                                                     |
| Delete/restore        | Only the approved temporary shipment was soft-deleted and restored on mobile; revisions/events/receipts reached six.                                                                     |
| Navigation            | Arabic and English mobile drawers opened; Escape returned focus to the menu trigger. Daily preview retained the explicit 08:00 Riyadh preview-only notice.                               |
| CSV                   | Mobile export reported successful preparation from an authorized snapshot; existing automated CSV injection tests passed.                                                                |
| Empty/loading         | Real loading states and no-match search state were inspected. Recovery behavior remains covered by existing adapter/application tests.                                                   |
| Browser zoom          | Brave login, employee dashboard and expanded reports reflowed at actual 100%/200% zoom; EN light and AR dark reports had client/scroll widths both 687px at 200%. Zoom restored to 100%. |

Screenshots and detailed raw measurements remain in ignored local artifacts; no credentials, tokens, backups or runtime state are published. The original in-app administrator session remains separate from the Brave employee test session. Brave is left signed out for the owner's own administrator login and MFA.

## Data preservation and temporary-fixture cleanup

The owner explicitly approved one disposable browser shipment and the existing suites' isolated fixtures. Before browser writes, a fresh private database backup was copied, SHA-256 checked and inspected with `pg_restore --list`. A baseline fingerprint covered all eight application tables, identities/password hashes, MFA factors, RLS/policies/grants, the command function, six migrations, cluster identity and existing Docker identities/mounts/bindings.

The temporary browser record **TR-0574** completed create → edit → complete → reopen → soft-delete → restore. After another verified private backup, a guarded transaction removed **only that exact UUID**, its six test events and six receipts. No broad owner-based cleanup, sequence reset or table truncation was used. A strict comparison with no fixture exclusions passed afterward: all original application rows, accounts/MFA, security definitions, migrations and Docker resources were preserved. **TR-0548, TR-0549 and TR-0550 remain unchanged**, including their history/receipts. Automatic shipment numbers consumed by tests are not reused.

No database/container reset, container replacement, credential change, production connection, email, deployment or merge occurred. Both original Vite listeners remained running on 5173 and 5174.

## Review limitations and next action

- Windows Chromium viewport emulation is not physical iOS/Android testing. Native phone keyboards, OS date pickers, pinch zoom and screen readers still need owner/device acceptance. Reduced-height viewport/dialog checks do not claim to emulate every mobile keyboard.
- Administrator access was checked using the retained AAL2 session and the real signed-JWT/MFA suites. No fresh manual administrator MFA enrollment or credential change was performed.
- No deliberate Docker outage/network reconfiguration was introduced for offline simulation. Existing recovery tests passed; actual browser loading and filtered-empty states were checked.
- The retained scenarios keep their original timestamps. Their labels describe the original owner review; daily-preview membership naturally changes with Riyadh calendar days.
- The owner must visually approve this UI candidate. Inspect `/workspace`, `/reports` and `/daily-report` after administrator login in the visible Brave preview at `http://127.0.0.1:5174/`. Keep PR #15 Draft/unmerged; do not start another phase.
