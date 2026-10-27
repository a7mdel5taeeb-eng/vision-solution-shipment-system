# Phase 3 — technical readiness recommendations

Prepared after Phase 2.6 inspection. **Planning only:** no database, identity provider, backend, bucket, email service or scheduler has been connected. The current React/Vite application remains a browser-local demonstration.

## Recommended persistence model

Use PostgreSQL behind a TypeScript application API and managed identity. Select the hosting provider, region, recovery objectives and authentication provider during Phase 3 approval.

| Table                          | Recommended shape                                                                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                     | Auth subject UUID, English/Arabic names, protected admin/employee role, active flag, timestamps                                                                                                                                                                                    |
| `shipments`                    | UUID primary key; unique sequence-backed public shipment number; owner FK; current customer, route, truck, driver, cargo and invoice text fields; nullable `driver_phone` text; server-generated start; workflow enum; nullable completion/deletion; update timestamp and revision |
| `shipment_events`              | Append-only event ID, shipment FK, authenticated actor, server timestamp, action, changed field names, permitted redacted details, completion timestamp when relevant                                                                                                              |
| `invoice_files`                | Shipment FK, generated private object key, original display name, detected MIME, size, hash, uploader and timestamp                                                                                                                                                                |
| `report_recipients`            | Administrator-managed addresses, enabled flag and change history                                                                                                                                                                                                                   |
| `report_runs` / `email_outbox` | Reporting day, recipient, idempotency key, delivery state, attempts, provider ID and timestamps                                                                                                                                                                                    |

Keep driver contact as a shipment snapshot; a global driver directory is not required for the approved scope. Store numbers as text, preserve the entered formatting, and apply server-side validation. Normalize empty values to null at the API boundary. Keep optional invoice files separate from shipment rows rather than persisting data URLs.

Use database-generated IDs and server timestamps. Add constraints for completion/start ordering and workflow consistency. Derive overdue from server time **strictly after** 96 hours; store only Pending/Completed workflow. Reopening clears completion without changing the original start. Add indexes for owner/start, open start timestamps, deleted state and common report filters. Use revision checks for concurrent edits and transactional writes for a shipment plus its history.

## Authentication and authorization

Use managed OIDC authentication in production and retain the role selector only in an isolated demonstration environment. The API must validate the session/token, resolve an active profile, and obtain roles from protected server-owned data. Never trust a browser-selected user ID or editable profile metadata as authorization. Use secure session handling, administrator MFA and revocation/deactivation checks.

Authorize every operation and resource lookup: employees can read/update their own active shipments and attachments; administrators can manage all records and perform soft deletion/restoration, reports, user administration and recipient configuration. Generate owner/start/number on the server. Restrict updates to explicitly permitted fields. Verify downloads, exports, guessed IDs and background-job access as well as page routes. These recommendations follow [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Row-level security

Enable default-deny PostgreSQL RLS on shipment, event and attachment metadata tables. Derive the authenticated identity from trusted request context, then apply ownership/admin policies to reads and writes with both row visibility and new-row checks. Employees must not transfer ownership or alter start/number/deletion fields through direct writes; enforce column restrictions and controlled server commands as well as RLS.

The application runtime role must not own tables, be a superuser or possess `BYPASSRLS`. Protect roles from self-escalation. Restrict service credentials to the server and narrowly scoped jobs. Test policies using real employee/admin/disabled-user sessions. PostgreSQL documents owner and superuser bypass behavior in its [row-security reference](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

## Invoices, audit and daily delivery

Use private object storage with short-lived authorized downloads. Validate extension, actual file signature and size on the server; generate object keys and scan uploads before publication. Shipment ownership and deletion state must govern attachment access. See [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Append audit events in the same transaction as domain changes. Clients cannot alter event actors/times or update/delete audit rows. Record phone field changes without exposing full phone values in general logs; apply the shipment's access policy to history. Establish backup/restore and retention rules with the company.

Schedule the daily digest for **08:00 Asia/Riyadh (05:00 UTC)**. Use yesterday's Riyadh calendar boundaries and the existing report semantics, calculated on the server. Write a durable outbox with a unique report-day/recipient key, retries, delivery status and safe replay after failure. Restrict recipients to administrator-managed settings; keep provider credentials server-only. No scheduler or delivery setup is part of Phase 2.6.

## Integration path and readiness

The existing pure domain functions, typed commands, date/report utilities and 28 tests provide a useful contract. Extract a repository/API boundary behind the demo provider, keeping the demonstration adapter separate from production. Move validation and authorization to the server; return server-created records and use loading/error/conflict states in the UI.

Before production: add database migrations, API validation and integration tests, RLS/attachment-access tests, concurrent numbering/edit tests, email retry/idempotency tests, monitoring and backup recovery evidence. Keep local prototype data isolated; import only explicitly selected, validated business data. The current frontend selector is a demonstration convenience and does not establish production security.
