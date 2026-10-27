# Phase 2 verification

Verified 26–27 October 2026, Asia/Riyadh. Phase 2 extends the existing React/Vite/TypeScript foundation; it does not introduce production integrations.

## Final automated checks

`npm run check` passed after the final source changes:

| Check                     | Result                                        |
| ------------------------- | --------------------------------------------- |
| Prettier formatting check | Passed                                        |
| Oxlint / React rules      | Passed with no warnings                       |
| Node domain tests         | **21 passed, 0 failed**                       |
| Strict TypeScript         | Passed for application, Vite config and tests |
| Vite production build     | Passed                                        |

The built application was smoke-tested at `http://127.0.0.1:4173/`. A clean final browser session returned no warning or error entries. Existing development server at `http://127.0.0.1:5173/` was identified as this project's Vite process and reused.

The tests cover seeded data and mixed employee workflows; the exact 96-hour boundary; completed/late-completed behavior; generated IDs, owner and timestamps; required-field/image validation; immediate second-precision completion; edit immutability/history; employee ownership and denied admin commands; valid/invalid completion times; reopening; soft deletion/restoration; inactive users and admin self-protection; recipient validation; Riyadh day boundaries; inclusive date ranges; daily digest sections; bilingual search/sorting; CSV encoding/escaping/formula protection; stored-data validation and reload/corruption behavior.

## Browser evidence

The verified flow is UI action → local command validation / role checks → browser persistence → updated dashboard, register, details or report. No API, external database or email boundary exists in this phase.

| Flow                       | Verified behavior                                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both roles                 | Administrator and employee selected through Demo experience; dashboards and navigation changed appropriately                                                                            |
| English and Arabic         | Both roles rendered in both languages; Arabic document `lang=ar`, `dir=rtl`; English returned to LTR                                                                                    |
| Employee scope             | Omar saw only his records; another employee's `TR-0002` rendered Shipment unavailable; direct `/reports` navigation redirected to the employee dashboard                                |
| Required fields            | An empty shipment submission displayed the translated required-field error                                                                                                              |
| Create shipment            | Employee saved fictional `TR-0033` with automatic owner/start and Pending workflow; dashboard total increased                                                                           |
| Edit and persistence       | Invoice number `INV-QA-33` and notes were edited, reloaded and still present; start and owner remained unchanged                                                                        |
| Invoice image              | A local PNG fixture was selected with the browser file chooser, stored as a data URL, saved and visible after reload                                                                    |
| Completion validation      | Both a pre-start timestamp and a future timestamp were rejected inline after the date-input fix                                                                                         |
| Completion / edit / reopen | A valid completion was saved; completion time was edited; reopening returned to Pending, retained the original start and appended history                                               |
| Overdue                    | Dashboard and alerts displayed automatically derived overdue records; unit tests verified `96h` versus `96h + 1ms` and reopening a late completion                                      |
| Admin delete / restore     | Test record moved to Deleted records with history intact; restored through the register and reappeared in active/invoice search                                                         |
| Register controls          | Invoice search found the test record; combined status/employee filters returned four completed records; sorting and five-row pagination advanced to rows 6–10                           |
| Report controls            | Invalid date range showed an error and disabled actions; Riyadh date, customer and employee filters combined to four rows with matching summary totals                                  |
| CSV download               | Arabic CSV downloaded successfully; verified UTF-8 BOM bytes `239,187,191`, Arabic headers and 33 CRLF-separated lines (header + 32 records)                                            |
| Demo users                 | Created, edited and deactivated a fictional test user; refresh preserved it; deactivation removed it from the selector and retained its card                                            |
| Recipients                 | Added a fictional test recipient, verified it after reload and removed it                                                                                                               |
| Daily report               | Observed branded previous-day starts/completions, all current overdue records, outstanding total and `/` admin-dashboard link; preview explicitly states that nothing is sent/scheduled |
| Reset                      | Confirmed reset restored 32 seeded records and original users/recipients; temporary test data was cleared                                                                               |
| All main admin links       | All shipments, Overdue alerts, Reports, Daily report preview, User management and Settings rendered their expected headings in the built application                                    |
| Mobile                     | Direct 390 × 844 browser viewport test: employee navigation, one-column form, required fields, save to `TR-0033`, mobile cards, Arabic RTL and no horizontal page overflow              |
| Tablet                     | Direct 768 × 1024 viewport: Arabic admin register, drawer closed on navigation, no page overflow; dense table scrolled inside its own container (1110px table inside ~707px container)  |
| Viewport cleanup           | Temporary browser viewport override reset after testing; agent-created test tabs closed or left to automatic cleanup                                                                    |

## Resolved findings

1. Browser testing exposed a controlled datetime input retaining the prior submitted state after its visible value changed. Completion submission now reads and validates the actual input value. Pre-start, future and valid values were tested again successfully.
2. Automatic start timestamps now use second precision to match completion controls. A dedicated regression test confirms that a shipment created at a fractional second can be completed immediately without an artificial pre-start error.
3. Dense registers keep shipment identity and actions pinned while other fields scroll. Mobile uses cards with larger touch targets, and editable mobile text inputs use 16px type.
4. Stored prototype data is shape-checked, including image fields and completion history. Invalid saved data is retained until an explicit reset rather than silently replaced.

## Screenshots and review artifacts

Files are local and ignored by Git, under `artifacts/phase2/`:

- `admin-english.jpg` — administrator dashboard, English / light.
- `admin-arabic.jpg` — administrator dashboard, Arabic / RTL / light.
- `employee-english.jpg` — employee dashboard, English / light.
- `employee-arabic.jpg` — employee dashboard, Arabic / RTL / light.
- `admin-english-full.jpg` — full-page administrator overview, including register and charts.
- `report-arabic.csv` — verified Arabic report export from the built preview.

A full-page RTL screenshot attempt exhibited a browser capture/tiling artifact. The Arabic deliverables use verified normal viewport captures instead; the rendered RTL layout and DOM bounds were correct with no page overflow.

## Remaining limitations

No unresolved functional errors were found in the tested scope. The following are intentional boundaries or unverified environments:

- The prototype is not secure production authorization. All records and identities are browser-local and inspectable; role switching is intentionally available.
- Persistence is per browser profile/origin, with one active editing tab recommended. There is no multi-user synchronization, server backup or quota beyond the browser's storage limit. Failed writes display an error and do not commit the attempted change.
- Invoice upload is a convenience image field, capped at 750 KB, without a document-management service.
- The browser print action invoked a blocking native preview that could not be reliably inspected by automation, including a standard-browser fallback. The test tabs were closed without printing. Print CSS is implemented and reviewed; no PDF was generated or visually certified.
- Real-device touch, Safari/Firefox and an exhaustive accessibility audit were not performed. Desktop and direct mobile/tablet viewport checks used Chromium-based browsers.
- The application lettermark/favicon and Arabic company-name translation remain provisional pending official brand approval.

No company website modification, deployment, DNS change, Supabase/production database, authentication provider, email service, scheduler, payment/accounting feature or GitHub push was performed. Phase 3 has not started.
