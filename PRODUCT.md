# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Administrators** remotely oversee the operation: all shipments, employees, overdue alerts, reports, daily-report recipients, and settings.
- **Employees** register and monitor their own shipments, often from a mobile device. Their experience must make registration and status scanning exceptionally simple.
- The Admin/Employee selection landing page is retained for the demonstration environment. It is not production authentication.

## Product Purpose

Vision & Solution is a lightweight bilingual Arabic/English shipment-management system for a trucking and logistics company. Its primary purpose is simple shipment registration and remote operational monitoring.

It is not an accounting system, ERP, GPS-tracking platform, or full fleet-management system.

## Positioning

The product provides a deliberately focused operational workspace: a shipment is registered once, remains visible to its owner or administrators, and surfaces deadline-based status and reporting without expanding into broader logistics or finance systems.

## Operating Context

- Shipments are registered, updated, completed, reopened, reviewed, and reported in Asia/Riyadh time.
- Administrators use an operational dashboard for statistics, overdue alerts, reports, exports, and settings.
- Employees need a mobile-friendly workflow for fast registration and clear shipment status.
- The prototype persists fictional demo data in the browser; it is a single-editor local experience with no production backend.

## Capabilities and Constraints

- Administrators have full visibility and management of shipments, employees, alerts, reports, and settings. They alone may delete and restore shipments.
- Employees may create, view, and edit only their own shipments.
- Shipment IDs are generated automatically. Saving records the start timestamp automatically; employees manually enter completion date and time.
- Pending shipments are yellow, completed shipments are green, and open shipments become red overdue strictly after 96 hours.
- Reopening retains the original start timestamp. Shipment modification history is preserved.
- Driver phone number, invoice number, and invoice image are optional.
- Reports support search, filters, and exports. The administrator dashboard includes shipment statistics and overdue alerts.
- The daily consolidated report is planned for 08:00 Asia/Riyadh and covers the prior calendar day's activity plus all currently open overdue shipments. Administrators configure recipients; actual email delivery is disabled in the prototype.
- Production authentication and authorization are separate future work. Existing role boundaries are prototype controls and must be enforced by the backend before production.
- Preserve Arabic/English localization, RTL/LTR support, approved UI/UX, official Vision & Solution branding, and the existing company website boundary.
- Do not add accounting, ERP, GPS tracking, fleet-management, production database, deployment, or external email delivery capabilities without explicit approval.

## Brand Commitments

- Vision & Solution / رؤى وحلول is the approved product identity.
- Preserve the official VS logo asset, branded cyan and blue accents, charcoal surfaces, and local Cairo and Montserrat fonts.
- The existing interface and official company branding are approved; future work refines rather than redesigns unless explicitly authorized.
- Improve the existing React implementation directly through maintainable components and design tokens. Comp-first work is reserved for a future major visual concept with explicit user approval.

## Evidence on Hand

- Approved official logo: `public/brand/vs-official.png`.
- Brand analysis and provenance: `docs/phase-2.6-brand-analysis.md`.
- Functional and workflow documentation: `README.md` and `docs/phase-2.6-specification.md`.
- The seeded people, customers, trucks, and shipments are fictional. No production credentials, deployment, database, or email integration exists.

## Product Principles

1. Keep shipment operations focused, fast, and understandable.
2. Make role boundaries clear in every workflow.
3. Treat Riyadh time and the 96-hour deadline as operational truth.
4. Support Arabic and English with equal functional and readability quality.
5. Preserve a safe path from a local prototype to a separately approved production system.

## Accessibility & Inclusion

- Employee workflows must be exceptionally simple, mobile-friendly, and fast to complete.
- Buttons and form controls must be accessible.
- Arabic and English typography must be readable.
- Keyboard navigation and visible focus states must be provided.
- Colour contrast must be sufficient.
- Validation messages must be clear.
- Shipment statuses must be clear and must not rely on colour alone.
- The interface must be fully responsive across supported mobile and desktop layouts.
