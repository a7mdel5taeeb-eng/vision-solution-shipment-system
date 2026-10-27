# Phase 2.6 — verification and change summary

Verified 27 October 2026, Asia/Riyadh. Scope: official brand integration and optional driver phone, on the approved Phase 2.5 architecture and layouts. The supplied request is retained in `phase-2.6-specification.md`.

## Corporate identity

The official [English](https://www.vsolutions.co/) and [Arabic](https://www.vsolutions.co/ar) homepages were inspected read-only, including header markup, inline CSS, font links and favicon reference. Exact source colors are cyan `#00D4FF`, blue `#007BFF`, charcoal `#0A0A0A`, near-black `#050505`, gray `#B3B3B3`, white and black. English uses Montserrat; Arabic uses Cairo and the name **رؤى وحلول**.

The official PNG was downloaded successfully and copied without editing. Its local SHA-256 matches the source asset. The shared header/mark, favicon, entry page, both dashboards, sidebar, registration, details, report print header, daily preview, settings, buttons and charts now use the official identity. Text variants for light surfaces are explicitly documented adaptations. Status colors remain distinct. The approved entry folio, simple employee view and admin priority desk are preserved.

See `phase-2.6-brand-analysis.md` for evidence and `public/brand/README.md` for provenance. Fonts and logo are served locally; no runtime brand/font CDN dependency was introduced.

## Phone behavior

- `driverPhone?: string` preserves compatibility with older version-2 records. No storage key change, reset or automatic contact-data injection is required.
- Telephone input sits beside Driver Name on desktop and below it on phones. It is optional, LTR within Arabic forms, labeled in both languages, and has inline validation.
- Supplied numbers retain their string formatting. Validation accepts 7–15 main-number digits, common separators, Saudi/international prefixes, Arabic/Persian digits and optional extensions. International `00` prefixes and optional `(0)` trunk notation are normalized for dialing. Syntax validation does not verify reachability.
- Details show the number or a translated empty state; personal cards offer a `tel:` link. Employees remain scoped to their own records; administrators can view/edit all records. No call was placed in testing.
- Phone edits enter field-change history. Blank optional values do not create a false history change when editing legacy records. Fresh seeds contain fictional US 555 examples; existing records keep their saved values.
- Normalization now allowlists editable shipment fields. The phone-edit regression test supplies attempted ID, owner and start overrides and verifies that they are ignored. A final administrator edit/reload also passed after this hardening.
- No SMS, WhatsApp, verification, external service or production backend was added.

## Browser tests

| Check                  | Result and evidence                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing                | Official asset decoded successfully (`naturalWidth=499`); correct company name and corporate descriptor; preserved role groups; no page overflow                                                                    |
| Existing data          | Administrator initially saw 32 active records: 15 pending, 11 completed, 6 overdue. Legacy `TR-0001` displayed the empty phone state; its edit form loaded the existing driver and a blank optional telephone field |
| Create                 | Omar created `TR-0035` with fictional `+1 (202) 555-0145`; ID/start/owner were automatic and the link was `tel:+12025550145`                                                                                        |
| Validation             | `123` was rejected inline before saving. The input was `type=tel` and not required. Unit tests cover Saudi/international examples and malformed or unsafe supplied values                                           |
| Owner edit and reload  | Changed to `+44 20 7946 0000 ext. 12`, reloaded successfully, and verified `tel:+442079460000;ext=12`. History showed Driver Phone Number as the changed field                                                      |
| Optional clear         | Omar cleared and saved the phone; details showed the translated empty state                                                                                                                                         |
| Admin edit             | Noura edited Omar's phone to `+1 202-555-0146`; it survived reload and history recorded Noura as actor                                                                                                              |
| Phone privacy          | Sara could not open `TR-0035` details or edit; the unavailable view contained zero `tel:` links. Her direct Reports route redirected to her personal dashboard                                                      |
| Workflow regression    | Completion and reopening succeeded; original start/owner and phone were preserved. All existing 96-hour, required-field, invoice, role, reporting and CSV tests remain included                                     |
| Delete/restore         | Administrator deletion and restoration retained the phone in both test browsers. QA records were then soft-deleted again and remain recoverable                                                                     |
| Arabic/English         | Both labels and messages rendered correctly. Telephone input and displayed number remained LTR. Cairo and Montserrat were verified through computed styles                                                          |
| Desktop placement      | Driver Name and phone inputs shared the same vertical position (`551.25px`) at 1440×1000                                                                                                                            |
| Phone layout           | 390×844 Arabic and 375×812 English/dark had no page overflow; card phone links rendered; registration/editing used one column                                                                                       |
| Tablet                 | 768×1024 admin used card fallback without page overflow                                                                                                                                                             |
| Administration screens | Reports, Settings, Daily Report Preview, Alerts and Users loaded without application failures; reports showed the original 32 active records and matching totals after QA cleanup                                   |
| Data preservation      | All 32 original active register rows were captured before and after the test; their displayed contents matched exactly. No original record was saved/edited/deleted. Read-only legacy editing was cancelled         |

The main in-app browser's QA record is **TR-0035**. The separate external-browser profile's responsive example is **TR-0033**. Both are recoverably deleted; no dataset was reset and prior deleted records were untouched. Screenshots that show a phone contact were taken before cleanup.

The in-app browser's warning/error log was empty. The external browser reported Adobe Acrobat extension errors from `chrome-extension://...`; these were outside the application source and did not block tests. Browser extensions were not modified.

## Automated tests

The suite contains **28 tests**: the original 21 plus seven phone tests covering:

1. Optional Saudi/international/Arabic/Persian formats and extensions.
2. Invalid types, short/oversized values, malformed prefixes and unsafe URI/text inputs.
3. Safe normalized telephone links, including `00`, extensions and optional international trunk zero.
4. Registration with supplied/omitted phone and invalid-number rejection.
5. Owner/admin editing, denied cross-owner edits, retained metadata and field history.
6. Legacy schema compatibility and no phantom blank-phone audit entry.
7. Legacy and edited-record local persistence without reseeding.

The final `npm run check` **passed**: formatting, lint, all **28 tests**, strict TypeScript and production build. Vite transformed 1,994 modules; JavaScript output is 446.31 kB (136.80 kB gzip). Output is saved in `artifacts/phase2-6/checks.txt`. The dependency tree was also checked with `npm ls --depth=0`.

Calculated key contrast ratios: primary action text 11.51:1, light-surface links 6.23:1, secondary text 4.98:1, and status labels 4.91:1 or higher. Exact pairs are saved in `artifacts/phase2-6/contrast.json`.

## Changed files

| Area                 | Changes                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Official assets      | Added `public/brand/vs-official.png` and provenance README; removed obsolete provisional favicon; updated `index.html` favicon                |
| Brand/components     | Updated `BrandMark.tsx`, `Brand.tsx`, `RoleSelectionPage.tsx`, report print header, root font imports, semantic tokens and current stylesheet |
| Registration actions | Updated shell, overview and shipments-page styling hooks to the brand registration action                                                     |
| Shipment model       | Updated `model.ts`, `repository.ts`, `seed.ts`, and field labels for optional phone and backward compatibility                                |
| Phone UI/utilities   | Added `DriverPhone.tsx` and `shared/lib/phone.ts`; updated form, details and cards                                                            |
| Localization         | Updated typed catalogs with official Arabic identity, phone labels/help/errors and corporate descriptor                                       |
| Dependencies         | Added locally bundled Montserrat and removed Inter; package manifest/lock updated                                                             |
| Tests                | Added `tests/phone.test.ts`; original shipment tests retained                                                                                 |
| Documentation        | Updated README; added supplied specification, brand analysis, this verification report, and Phase 3 readiness recommendations                 |

Pre-change source snapshot: `artifacts/phase2-6/before-phase2-6.zip`. Browser evidence: `artifacts/phase2-6/browser-evidence.json`. Read-only official-site observations are saved in `official-en-evidence.json`, `official-ar-evidence.json` and `official-site.jpg` in that directory.

## Screenshots

| View                                  | File under `artifacts/phase2-6/` |
| ------------------------------------- | -------------------------------- |
| Officially branded landing, Arabic    | `landing-ar.jpg`                 |
| Administrator dashboard, Arabic       | `admin-ar.jpg`                   |
| Employee dashboard with phone         | `employee-ar.jpg`                |
| Registration field beside Driver Name | `phone-form-ar.jpg`              |
| Details with clickable phone          | `phone-details-ar.jpg`           |
| Mobile contact card, Arabic           | `mobile-phone-ar.jpg`            |
| Mobile phone field, English/dark      | `mobile-phone-form-en-dark.jpg`  |
| Reports, English                      | `reports-en.jpg`                 |
| Settings, English                     | `settings-en.jpg`                |

## Local preview and limitations

The existing Vite preview remains at `http://127.0.0.1:5173/`, persistent session `45081`, launched with `npm run dev -- --host 0.0.0.0`. Final checks returned **HTTP 200** for the application and local official logo. Windows confirmed process **37224** listening on **0.0.0.0:5173**. The server is kept running and the in-app browser is left on the Arabic account-selection page.

This remains a browser-local demo, not production security. Driver contacts are fictional. No native Print/Save PDF output, real-device touch, Safari/Firefox, or exhaustive accessibility audit was certified in this phase. Key text/action/status contrast and responsive layouts were checked. Optional WASI peer warnings appeared during font package cleanup, while the installed top-level dependency tree remained valid; the final build confirms the active Windows toolchain.

Phase 3 work is limited to the planning report `phase-3-readiness.md`. No real authentication, database, bucket, email delivery, scheduler, DNS changes, deployment, public-site modification or GitHub push occurred. Stop after Phase 2.6 for approval.
