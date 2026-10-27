# Phase 2.9 — Accessibility fixes and final UI hardening

Date: 27 October 2026 (Asia/Riyadh).

## Approved baseline

PR #2 was reviewed at `c70190b2e1988aa9cb9889a8432f6d5dc847d997`, with the expected eight files and no extra source changes. All 28 baseline tests, formatting, lint, and build passed. It was marked ready and merged with explicit approval at **`d16221c6332d756516d2f5429f3d8d532b574c19`**. GitHub `main` was fetched and local `main` fast-forwarded safely. No uncommitted work was present or discarded.

Phase 2.9 uses `feature/phase-2.9-accessibility-fixes`. Its pull request must remain unmerged pending approval.

## Changes and measurements

| Verified issue             | Before                              | After                                                                        |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| Light input boundary       | `#c3d2d9` on white: 1.55:1          | `--control-border: #748792` on white: **3.73:1**                             |
| Dark input boundary        | `#445a67` on `#111719`: 2.50:1      | `--control-border: #6f8794` on `#111719`: **4.80:1**                         |
| Entry role/action text     | 9px role text, 10px actions         | 12px metadata/action text                                                    |
| Entry introduction         | 11px on mobile                      | 14px, same typefaces and hierarchy                                           |
| Form labels and text input | 12px labels; 16px mobile input      | 14px labels; 16px input across widths                                        |
| Daily preview              | 10–11px metadata, 12px introduction | 12px metadata; 16px introduction                                             |
| Required-field validation  | Generic toast; Save kept focus      | Named inline errors, `aria-invalid`, `aria-describedby`, first-invalid focus |

Contrast uses standard sRGB relative luminance from actual computed border/background colours observed in the browser. Normal input boundaries and focus/error states are tested against both normal and soft control surfaces. The 3:1 target applies to identifying control boundaries, not decorative panel separators. The decorative `--border-strong` token is unchanged; forms and register controls use the new dedicated token.

Measured state contrast against the input background:

| State          | Light  | Dark    |
| -------------- | ------ | ------- |
| Invalid border | 5.47:1 | 9.27:1  |
| Focus outline  | 6.23:1 | 10.22:1 |

Invalid inputs retain the error colour while the focused input also has a separate outline. Disabled form-control styles use a dashed boundary, muted text, and a soft background; the current shipment flow does not disable editable inputs, so that style is source-verified rather than exercised through a fabricated workflow. The existing disabled Save behavior during invoice reading is retained.

### Typography and layout

The existing Cairo and Montserrat families, logo, company palette, heading sizes, and role layouts are preserved. Shared purpose-based tokens replace screen text sizes below 12px in the operational and redesign stylesheets. Dense metadata uses 12px; supporting copy and control labels use 14px; inputs and the daily-report introduction use 16px. Existing larger headings and numeric statistics are unchanged. Print-specific size rules are preserved.

This retains operational density instead of applying a scale factor to every element. The normal font-loading setup is unchanged. No fonts, dependencies, or animation effects were added.

### Form behavior

- Shared required-field names and the unchanged 200-character trimmed limit are exported from the existing domain model to keep UI feedback aligned with command validation.
- The presentation validator derives errors from current values. It adds no new business requirements and does not alter saved data.
- Submission reveals each error and focuses the first invalid input in visual/tab order, including the optional phone before cargo.
- Each required error identifies the field in Arabic or English and is associated by a unique `useId`-based description. Labels remain stable as errors change.
- Correcting a field removes its error immediately; a summary remains only while errors remain. Previously entered values are preserved.
- Optional phone blur validation and safe Arabic/international phone handling are retained. Blank phone, invoice number, and invoice image remain valid.

## Verification evidence

Automated: **36/36 tests pass**, including the original 28 and eight targeted regressions. `npm run check` passes formatting, Oxlint, all tests, TypeScript, and production build. The new tests cover missing fields, order, correction, preservation, phone/digit behavior, the unchanged length limit, both themes' control/focus/error contrast, and error-text contrast.

Browser checks used the local Chromium preview with emulated viewports, not physical touch devices:

| Check                   | Observed result                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty English form      | Six inline errors; focus on customer; optional phone valid                                                                                              |
| One missing field       | Only cargo invalid after filling the other required fields; focus on cargo                                                                              |
| Multiple missing fields | Phone and cargo invalid; focus on phone because it comes first in the form                                                                              |
| Corrections             | All errors and summary disappeared immediately; existing input values survived                                                                          |
| Arabic errors           | All six required errors translated and named their fields; Arabic submit focused customer                                                               |
| Keyboard                | Enter on Save triggered validation; Tab followed origin → destination → truck → driver → phone → cargo → optional-details summary, with visible outline |
| Employee create         | Omar saved `TR-0033`, with Arabic phone digits, automatic ID/start and no invoice                                                                       |
| Completion / reopen     | Completion dialog saved; reopen returned Pending; original start and all history retained                                                               |
| Persistence             | The reopened record and history survived refresh                                                                                                        |
| Ownership               | Sara's direct request for `TR-0033` showed Shipment unavailable                                                                                         |
| Administrator           | Noura could open the employee's record                                                                                                                  |
| Reports                 | Customer filter yielded one data row; CSV download completed; daily preview rendered                                                                    |
| 390px                   | Entry, employee cards, form, admin dashboard, and daily preview had no document overflow; admin used cards                                              |
| 1440px                  | Arabic and English admin dashboards had no document overflow and retained the paginated ten-row table                                                   |
| Themes / language       | Light and Dark sampled with English LTR and Arabic RTL; Cairo and 16px input text verified                                                              |
| Console                 | No errors or warnings during final inspected flow                                                                                                       |

The fictional QA shipment `TR-0033` remains in the local demo as a reopened Pending record; it was not silently deleted. A filtered fictional CSV was downloaded locally during verification. Neither operational data nor screenshots are committed as application source.

Screenshots delivered with the chat: `artifacts/phase-2.9/form-en-light.jpg` and `artifacts/phase-2.9/form-ar-dark.jpg`. These local ignored artifacts show the actual updated form and validation states. The local server remains available at `http://127.0.0.1:5173/`.

## Impeccable and React review

Used project Impeccable **4.8.0**, its harden/typeset/audit/polish references, the approved code-first context, and Vercel React Best Practices / Verification guidance. Work followed the existing local UI → validated domain command → local storage → rendered record/report path.

The post-fix rendered 390px entry scan has **five findings**, compared with 24 previously: two nested-card warnings, two one-word-last-line advisories, and one decorative-grid advisory. It reports **no tiny-text or undersized-functional-text findings** on this surface. The type-only source scan retains the known Montserrat heuristic warning. The full source scan retains the same four status/accent stripe warnings, approved-font warning, and grid advisory; no suppressions were added. These brand/layout heuristics do not justify a redesign in this phase.

Sampled audit score moves from **15/20 to 16/20**: accessibility 3, performance 3, theming 3, responsive 3, implementation integrity 4. All three scoped Phase 2.8 findings are resolved in the tested contexts. The score remains a scoped engineering judgment, not a certification or an exhaustive accessibility claim.

The validator performs seven small checks per form render, with no effects or duplicated error state. Existing pagination/filtering and storage writes are unchanged. Production JS is 447.30 kB / 137.16 kB gzip versus 446.31 kB / 136.80 kB gzip before these fixes. No new dependency or speculative optimization was introduced.

## Remaining limits

NVDA/VoiceOver, real iOS/Android devices, Safari/Firefox, forced-colour mode, and exhaustive zoom/reflow coverage remain outside this run. Dense report tables retain intentional internal horizontal scrolling on phones. Existing demo authorization is still browser-local prototype behavior. The exact 96-hour boundary, Riyadh dates, deletion/restoration, recipients, and CSV escaping remain covered by the unchanged domain tests.

No public company website, production database, authentication provider, email delivery, or deployment was modified. Phase 3 has not started.
