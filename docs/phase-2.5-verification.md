# Phase 2.5 — creative refinement and functional validation

Verified 27 October 2026, Asia/Riyadh. This is a refinement of the existing application. The project, stored schema, local dataset and domain workflows were preserved.

## Design rationale and changes

The custom identity takes its cue from a shipment route: origin, turn and destination. A reusable V route mark and matching favicon replace the reference-like truck tile. Ink navy, muted violet, amber and warm neutral surfaces give the platform a quieter corporate identity. Route rules and consignment details repeat this vocabulary across screens.

The landing page now combines a corporate identity panel with compact employee and administrator account groups. It retains the exact bilingual account-selection headings, all active demo accounts, language switching, appearance controls and demo-only entry. On phones, the identity panel becomes a short heading so account selection remains the priority.

The employee workspace keeps its simple header and amber registration action. A slim welcome strip and compact statistics bring the first shipment to **416 px**, down from **606 px**, at the same **1084×724** viewport: approximately **31% earlier**. Customer names have greater prominence. Cards show labeled loading/unloading locations, vehicle and driver details, a visible start timestamp, status text/icons, and direct workflow actions. Color is supplementary to labels and icons.

The administrator dashboard retains four summary cards and restores the **Priority desk**. It uses the existing active-record filter and oldest-start-first ordering to show the three longest-overdue shipments. All alerts remain one link away. My Shipments was removed from administrator navigation; the route remains available for existing bookmarks. Arabic keeps the sidebar on the right, and English places it on the left.

## Verification boundary

The tested flow is **account selection → role-scoped UI → existing validated command → browser-local persistence → updated cards, register, details and report**. There is no API/backend/external service boundary in this prototype. Browser logs contained no warnings or errors during the final administration-page check.

## Detailed functional tests

| Requested flow              | Evidence and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Demo role selection      | All four entries tested. Noura saw the admin dashboard and all 32 original active shipments. Omar and Sara each saw 11 personal shipments, Faisal saw 10. Logout returned to account selection. Refresh retained the selected account; visiting `/dashboard` after logout returned to the landing page.                                                                                                                                                                                           |
| 2. Employee registration    | Omar saved fictional `TR-0034` with all six required fields. ID, owner and start were automatic, status was Pending. Original start displayed `27 Oct 2026, 05:59` in Riyadh.                                                                                                                                                                                                                                                                                                                     |
| 3. Employee visibility      | The three employee account card IDs differed appropriately. Sara could not edit Omar's `TR-0034`; the unavailable state appeared. No employee card exposed a deletion button. Visiting the restoration route as an employee returned to their dashboard. Existing domain tests also deny cross-owner mutations and admin commands.                                                                                                                                                                |
| 4. Editing                  | Customer changed to `Phase 2.5 validation — edited`; invoice `INV-P25-34` and notes saved and survived a full reload. Owner and original start remained unchanged.                                                                                                                                                                                                                                                                                                                                |
| 5. Manual completion/reopen | A pre-start completion (`26 Oct, 10:00`) was rejected inline. A valid manually entered completion (`27 Oct, 06:00`) saved. Reopening returned to Pending, removed the current completion timestamp, retained the exact original start and owner, and appended history. The card's completion action also opened the correct dialog on a phone; it was cancelled without mutating that existing record.                                                                                            |
| 6. Automatic overdue        | All 21 domain tests passed, including exactly 96 hours versus 96 hours + 1 ms, completed shipments remaining Completed, and reopening a late completion retaining its start and recalculating overdue. Browser displayed six derived overdue shipments. Dashboard urgent IDs were `TR-0030`, `TR-0026`, `TR-0018`, matching the first three of the full oldest-first alert list. No OS clock or shipment starts were altered to simulate time.                                                    |
| 7. Full admin access        | Noura saw 33 active shipments after test registration, including Omar's new record. Search by its invoice found it. Admin navigation omitted My Shipments and retained all administrative sections.                                                                                                                                                                                                                                                                                               |
| 8. Delete/restore           | Admin soft-deleted `TR-0034`, restored it from Deleted Shipments, and verified invoice, owner, start and complete history. The test record was then soft-deleted again as cleanup; it remains recoverable. No original shipment was edited or deleted.                                                                                                                                                                                                                                            |
| 9. Daily preview            | Displayed the previous Riyadh calendar day, 26 October: 3 starts, 0 completions, 6 open overdue shipments and 21 outstanding shipments. Fictional recipients, preview-only notice, future 08:00 schedule and dashboard link were present. Nothing was sent or scheduled.                                                                                                                                                                                                                          |
| 10. Bilingual/responsive    | Arabic/English entry and dashboards tested. Correct document language/direction, RTL sidebar/drawer, locally bundled Cairo/Inter, theme switching and role-specific navigation. Tested 1440×900 desktop, 1084×724 preview, 768×1024 tablet, 390×844 Arabic phone and 375×812 English dark phone. No page-level horizontal overflow. Employee cards use two columns on tablet/desktop and one on phone; the admin table becomes cards on smaller screens. Phone registration uses a single column. |

The Arabic phone role selector's administrator entry ends around **754 px** in an 844 px viewport. Mobile navigation drawers opened and closed correctly; the RTL drawer aligned to the right and omitted admin My Shipments.

## Data preservation

Before and after the test, all **32 pre-existing active register rows** were captured through the UI and compared. Their complete displayed contents match exactly. Only the new QA record `TR-0034` was created, edited and moved through workflows; it is now recoverably deleted. The earlier deleted QA record was not changed. No demo reset was used in either browser.

SHA-256 hashes match the pre-refinement snapshot for:

- `src/features/shipments/model.ts`
- `src/features/shipments/query.ts`
- `src/shared/lib/dates.ts`
- `src/features/reports/report-model.ts`
- `src/app/demo/repository.ts`
- `src/app/demo/seed.ts`

Hash baseline: `artifacts/phase2-5/business-before.json`. Browser observations: `artifacts/phase2-5/browser-evidence.json`. Source snapshot: `artifacts/phase2-5/before-refinement.zip`.

## Contrast and component review

Calculated foreground/background contrast ratios for the explicit design tokens:

| Pair                                | Contrast |
| ----------------------------------- | -------- |
| Main text / white                   | 14.35:1  |
| Secondary text / white              | 4.81:1   |
| White / violet action               | 6.56:1   |
| Dark text / amber action            | 8.16:1   |
| Pending label / pending surface     | 5.40:1   |
| Completed label / completed surface | 5.59:1   |
| Overdue label / overdue surface     | 4.91:1   |
| Dark theme secondary text / surface | 7.37:1   |

React review checked semantic buttons/links, labeled controls, keyboard focus, decorative SVG accessibility, stable record keys, derived state, unchanged command validation and immutable overdue sorting. No new runtime dependency was introduced.

## Automated checks and local server

The final `npm run check` **passed**: Prettier, Oxlint, all **21 Node domain tests**, strict TypeScript and Vite production build. Vite transformed 1,992 modules and generated a 443.01 kB JavaScript bundle (135.77 kB gzip). Results are saved in `artifacts/phase2-5/checks.txt`.

The local preview remains at `http://127.0.0.1:5173/`, in persistent terminal session `45081`, using `npm run dev -- --host 0.0.0.0`. The existing server is reused and left running. No deployment was performed.

Final HTTP verification returned **200**; Windows confirmed the existing process **37224** listening on **0.0.0.0:5173**. The in-app preview is left on the Arabic account-selection page for review.

## Screenshots

Actual application screenshots, not mockups. Desktop screenshots use 1440×900; phones use 390×844 or 375×812. Small browser-extension controls may appear at the edge of captures.

| View                            | File                                                |
| ------------------------------- | --------------------------------------------------- |
| Arabic landing, light           | `../artifacts/phase2-5/landing-ar.jpg`              |
| Arabic admin with priority desk | `../artifacts/phase2-5/admin-ar.jpg`                |
| English admin                   | `../artifacts/phase2-5/admin-en.jpg`                |
| Arabic employee                 | `../artifacts/phase2-5/employee-ar.jpg`             |
| Arabic phone employee           | `../artifacts/phase2-5/mobile-employee-ar.jpg`      |
| English dark phone employee     | `../artifacts/phase2-5/mobile-employee-en-dark.jpg` |
| Arabic phone administrator      | `../artifacts/phase2-5/mobile-admin-ar.jpg`         |

## Files and limits

Added `src/shared/ui/BrandMark.tsx` and this verification report. Updated Brand, navigation, entry, overview, overdue section, shipment cards, bilingual refinement copy, design tokens, current layout stylesheet, favicon and README. The stylesheet was revised in place instead of adding another override layer.

This remains a browser-local, single-editor demo. The custom application mark remains subject to brand approval. Native Print/Save PDF, real-device touch and Safari/Firefox were not recertified during this refinement. No blocking application errors were found. No backend, real authentication, external service, company-website modification, deployment, DNS change, GitHub push or Phase 3 work was introduced. Work stops after Phase 2.5 for review.
