# Phase 2.8 — Synchronization, Impeccable portability, and design audit

Date: 27 October 2026 (Asia/Riyadh).

## Phase 2.7 closure

PR #1 was reviewed at `7238a495346393471e5ce502b45d95e1f8e99abe`. Its four files contained only the approved repository instructions, README workflow, product context, and code-first configuration; no secrets or application changes were included. Formatting, lint, 28 tests, and production build passed before merging.

The explicitly approved merge succeeded at **`56a6548c482d52cc80acf89780f2e714d79468e9`**. Local `main` was fast-forwarded from GitHub, and `AGENTS.md`, `PRODUCT.md`, `README.md`, and `.impeccable/config.json` were confirmed in its tree. Phase 2.8 starts from this revision on `codex/phase-2.8-portability-audit`. Phase 2.8 has no approval to merge yet.

## Reproducible installation

The project uses the official Impeccable installer with a separately pinned skill archive, rather than committing generated `.agents/` or native binaries. The launcher package is 4.8.0, skill release is `skill-v4.8.0`, engine is 0.1.18, and the release ZIP SHA-256 is `82e6f6ff3a2b18f46f0f2fc388c1ab7abf3ccc52bbfc522456396d13011d6706`.

`scripts/setup-impeccable.ps1` resolves paths from its own directory, verifies tooling and the Git root, preserves existing installations, validates the skill version and engine handshake, and uses the official hook setup to merge provider manifests. It restores its process-local bundle override on exit. It never uses `--force`, changes application dependencies, replaces product context, or changes a machine's security policy. Shared config and pins travel through Git; generated skills, hooks, consent, and caches are local.

Evidence:

- Existing home-computer skill: 4.8.0 / engine 0.1.18; `-CheckOnly` passed.
- Isolated local clone with no `.agents/`: official pinned ZIP downloaded and digest verified; project Codex skill and hook installed successfully.
- Repeated `-CheckOnly` in that clone passed; `buildPath: code` survived hook setup.
- PowerShell parser reported no syntax errors. Windows PowerShell 5.1 syntax is targeted; execution was tested under the current PowerShell host, not on a physical school computer.
- No global skill, company website, production service, or deployment was modified.

### Lockfile finding and correction

The original GitHub lockfile failed a clean `npm ci` under npm 11.19.1 with four missing packages: `@emnapi/core@1.11.3`, `@emnapi/runtime@1.11.3`, `@emnapi/wasi-threads@1.2.3`, and `tslib@2.8.1`. They are optional transitive dependencies of the already-declared Tailwind WASM tooling.

The pre-existing local change adds those entries and normalizes six peer flags; it does not change `package.json` or upgrade existing package versions. It was preserved byte-for-byte (SHA-256 `3d31d16681fd03cc48cfb2c02b7e5b3ab244feed4d08c91c40fffa5e1aedc668`). With this correction copied into the isolated clone, `npm ci` succeeded, npm reported zero vulnerabilities, and all 28 tests plus formatting, lint, and build passed. This disproves the earlier classification of the lockfile change as unnecessary; it is included in Phase 2.8 to repair fresh-clone installation.

## Design audit: implementation integrity verdict

**Pass, with targeted accessibility follow-up.** The operational interface retains a coherent official identity, role-based controls, logical RTL layout, native form controls, and domain-specific shipment content. There is no evidence requiring a redesign. The approved code-first workflow and existing components/tokens remain the foundation.

This is a read-only audit, not accessibility certification. No source UI changes were made.

| Dimension                | Score / 4   | Evidence                                                                                                         |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Accessibility            | 2           | Labels, skip link, status text and visible keyboard focus work; input boundary contrast is insufficient.         |
| Performance              | 3           | Paginated register; production JS 446.31 kB / 136.80 kB gzip, CSS 96.50 kB / 19.71 kB gzip.                      |
| Theming                  | 3           | Light/dark tokens and bilingual fonts work; some low-level hard-coded values remain.                             |
| Responsive design        | 3           | No document overflow in sampled 390px and 1440px layouts; mobile register uses cards.                            |
| Implementation integrity | 4           | Official branding, role experiences, functional status colours, reusable primitives, and correct Riyadh context. |
| **Total**                | **15 / 20** | **Good: address the accessibility and readability findings before production.**                                  |

These scores describe sampled implementation quality. They do not claim all WCAG AA criteria pass.

### Scope and method

- Source review of shipment form, native dialog wrapper, token definitions, CSS cascade, routes, list query/pagination, and local persistence.
- Impeccable 4.8.0 source detector: six findings, including one advisory.
- Rendered Impeccable scan of the account selection page at 390×844: 24 findings, including three advisories. Multiple findings refer to the same small-text pattern; they are grouped below.
- In-app Chromium preview: daily report and shipment form at 390×844; administrator dashboard at 1440×900 and 390×844; Arabic RTL and English LTR; light and dark theme samples.
- Empty shipment form submission and keyboard Tab inspection. No shipment was created or deleted.
- Computed style and document-width measurements, screenshots, and standard sRGB relative-luminance contrast calculations.

### Verified findings

**[P1] Form boundaries do not meet non-text contrast expectations.**

- Location: `src/styles/prototype.css:843` and `src/styles/tokens.css` (`--border-strong`).
- Category: accessibility.
- Evidence: customer input and panel share the same background. Computed boundary colours were `#c3d2d9` on white in light mode (1.55:1) and `#445a67` on `#111719` in dark mode (2.50:1), below 3:1.
- Impact: low-vision users may struggle to identify input boundaries, especially before focusing a field.
- Standard: WCAG 1.4.11, non-text contrast for identifying controls.
- Recommendation: strengthen a control-specific border token in both themes, preserving the official palette. Suggested command: `$impeccable harden`.

**[P2] Supporting and functional typography is too small on narrow screens.**

- Location: `src/styles/redesign.css:303`, `:419`, `:1656`; daily-report presentation in `src/styles/prototype.css`.
- Category: accessibility / responsive design.
- Evidence: the rendered mobile detector found 9px account-role text, 10px entry-action text and 11px introductory copy. Daily-report computed text included 10–11px metadata and supporting copy. Arabic form labels were 12px; primary form inputs were 16px and Cairo rendered correctly.
- Impact: slower scanning and increased zoom demand during mobile operations.
- Standard: a readability recommendation; WCAG has no universal minimum font-size requirement. Reflow/zoom need broader testing before any compliance claim.
- Recommendation: raise functional secondary type through shared tokens, test both languages at narrow widths, and retain the current hierarchy and brand fonts. Suggested command: `$impeccable typeset`.

**[P2] Required-field validation does not identify or focus the missing field.**

- Location: `src/features/shipments/ShipmentFormPage.tsx:48` and `:95`.
- Category: accessibility / implementation quality.
- Evidence: submitting the empty form produced the translated general required-fields alert; focus remained on Save. All six required fields lacked field-specific invalid-state/error associations. The phone field already has a dedicated validation/focus pattern.
- Impact: users must inspect the form themselves to locate errors, particularly when one field is missing below the viewport.
- Standard: improves error identification and recovery; this audit does not claim that lack of `aria-invalid` alone is a WCAG failure.
- Recommendation: reuse the phone error pattern for required fields, preserve entered values, focus the first invalid field, and retain a concise summary. Suggested command: `$impeccable harden`.

Issue totals after grouping repeated instances: **0 P0, 1 P1, 2 P2, 0 P3**.

### Detector triage and positive findings

- The Montserrat warning conflicts with the explicitly approved brand font and is not actionable. The four side-border warnings occur in existing status/operational treatments; preserve them unless a visual review identifies actual confusion. The decorative grid and nested role-card warnings are aesthetic heuristics, not functional failures. No suppressions were added.
- Native inputs have labels; optional phone validation has help/error associations. Native dialogs restore prior focus and support cancel. A keyboard Tab to the appearance control displayed a 2px cyan outline in dark mode.
- Arabic changed the document to `lang=ar`, `dir=rtl`, with Cairo. Required input text remained 16px. Sampled 390px form and daily report had scroll width equal to their 375px content width; the scrollbar accounts for the viewport difference.
- At 1440px, the register showed 10 paginated rows; at 390px its table was hidden in favour of cards. Desktop icon actions measured 28×30px: above the 24px WCAG minimum, below the 44px comfort target; they were not classified as AA failures.
- Status tokens provide readable status text in addition to yellow/green/red. Light-theme token contrast ratios against their matching soft backgrounds: Pending 5.40:1, Completed 5.59:1, Overdue 4.91:1.
- No heavy charting library or external font request is required. Routes currently load eagerly; route splitting is an opportunity only if measurements show a useful improvement. No speculative refactor is recommended now.

### Recommended order and coverage limits

1. `$impeccable harden`: control-boundary contrast and field-specific validation.
2. `$impeccable typeset`: bilingual secondary type and mobile readability.
3. `$impeccable audit`: verify the fixes at both themes/languages and multiple widths.
4. `$impeccable polish`: final consistency check after approved fixes.

The user may authorize these separately or together. No fixes are implemented by this audit. Physical touch, screen readers, Safari/Firefox, full zoom/reflow coverage, slow-device performance, and production authorization are not certified here. No email was sent; no Phase 3 implementation began.

## References

- [Official 4.8.0 release](https://github.com/pbakaus/impeccable/releases/tag/skill-v4.8.0).
- [Official installer and local-bundle override](https://github.com/pbakaus/impeccable/blob/skill-v4.8.0/crates/skills/src/bundle.rs).
- [Official CLI instructions](https://github.com/pbakaus/impeccable/blob/main/README.npm.md).
- [OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills).
