# Phase 4A / 4B — secure shipment invoice image attachments

**PLANNING ONLY · SCHOOL → HOME · 29 October 2026.** Owner has now approved up to **THREE available invoice images per shipment**, **3 MiB (3,145,728 bytes) maximum per image**, and **JPG/JPEG, PNG and WebP only**. PDF, HEIC/HEIF, animated media and other types are excluded for the initial release. Employees may upload/replace images for their own shipments; **logical detach is administrator AAL2-only**. This is POLICY APPROVAL, **not approval to implement, migrate, create Storage, deploy, merge PR #16 or access the powered-off HOME stack**. Runtime, quotas, fidelity, backup/retention and hosting-region choices still require review.

## Verified starting point

The SCHOOL checkout was clean on an older Phase 3B branch. Git status, branches and the single worktree were inspected, then origin was fetched. GitHub confirmed PR #15 merged at **`ee23364be40236c37e37d6cd73e92014fbddd7d4`**. The existing `feature/phase-4-release-readiness-planning` branch was selected with its matching upstream at `e7134897a5b52a2b33c5e7f69208eb779ac4e119`; the approved merge is its ancestor. No local work was discarded, stash created, main updated, or duplicate branch/PR created.

The baseline already has separate Demo/Connected modes, real local Auth/MFA, protected roles/RLS, transactional shipment commands, reports and the approved mobile UI. **Connected invoice numbers exist; Connected invoice image attachments do not.** Demo data URLs are not production file storage and must remain isolated. Retained HOME records TR-0548/TR-0549/TR-0550, accounts/MFA, volumes and six applied migrations must remain untouched.

Source inspection, not a live database query, establishes:

- `invoice_files` already references shipments/profiles, with UUID ID, unique object key, type/size/checksum, lifecycle state and timestamps. Its existing partial unique index allows **one available invoice per shipment** under the OLD constraint; this must be replaced by a forward-only migration design enforcing **maximum three available images**, not bypassed in the browser.
- The CURRENT deployed schema limits individual image metadata to **768,000 bytes (750 KiB)**; the OWNER-APPROVED target is **3,145,728 bytes (3 MiB) PER IMAGE** with PNG/JPEG/WebP. The database check, private Storage policy, gateway, validation and quota rules therefore require reviewed forward-only updates. No application command currently uploads or activates files.
- `shipment_events.action` currently accepts only shipment lifecycle actions; `(shipment_id, revision)` is unique. Attachment events need a forward-only schema and Connected parser/label change, not edits to old migrations.
- Connected models/forms expose `invoice_number`; mapping sets `invoiceImage` to empty and draft recovery rejects image data. No image bytes should be added to existing text draft storage.

## 4A decisions and proposed first-release scope

**Approved policy: up to THREE optional available images for each shipment**, independently identifiable and replaceable. Keep invoice number and image independently optional; do not block shipment registration, completion or reopening when Storage is unavailable. Preserve all existing ownership, original-start, numbering, workflow and >96-hour rules. Existing completed shipments remain editable under existing permissions; a new document-lock rule would require separate approval.

| Topic               | Recommended starting policy                                                                                 | Approval needed                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Quantity            | **Approved: maximum THREE available images per shipment**; add until full, then replace a selected image without object overwrite | Page grouping, ordering and labels to finalize in 4A |
| File types          | **Approved: static JPG/JPEG, PNG and WebP only**                                                              | PDF, SVG, GIF, animation, HEIC/HEIF and Office documents excluded                                            |
| File size           | **Approved: 3 MiB (3,145,728 bytes) PER IMAGE**, up to ~9 MiB active before overhead or retained versions    | Requires forward-only DB constraint, Storage/gateway policies and resource/quota tests                       |
| Mobile optimization | Offer explicit resize/compression with readable preview; never silently crop or replace the user's original | HEIC/HEIF must give a helpful unsupported-format/conversion message; fidelity/originals still open          |
| Removal             | **Approved: administrator AAL2-only logical detach; employees upload/replace OWN images**; no browser physical purge | Legal retention, physical purge policy and forensic preview still open |
| Deleted shipments   | Admin may inspect metadata/history; no image bytes until shipment restoration                               | Decide whether a separate forensic preview is needed                                                        |
| Recovery            | Separate encrypted object backups plus database metadata recovery                                           | Approve region, retention, quotas, RPO/RTO and who operates recovery                                        |

**Approved business requirements are now fixed for quantity (3), size (3 MiB/image), JPEG/PNG/WebP formats, own-employee upload/replace and administrator AAL2-only detach.** The remaining table rows and pending architecture/retention decisions are recommendations requiring separate sign-off before authorizing 4B code. No accounting, OCR, payments, email attachments or general document-management system is proposed.

## Supabase Storage and API architecture

Use **one explicitly private `shipment-invoices` bucket in the eventually approved Supabase environment**, alongside the existing database/Auth. Use the existing project when implementation is authorized; a second Supabase instance is unnecessary for this feature. No bucket or project is created now. Generate immutable object keys such as `<shipment-uuid>/<attachment-uuid>.jpg`; do not use original filenames, TR labels, phone numbers, email addresses or browser-selected ownership as security identifiers.

Recommend an **authenticated validation gateway** for bounded 3 MiB-per-image uploads, followed by private Storage and transactional metadata publication. A future Supabase Edge Function is the first runtime candidate; confirm that a maintained, bounded image decoder/re-encoder works within its limits before selecting it. If it cannot, document and approve a compatible server runtime rather than weakening validation. This runtime/dependency check is part of 4A and does not authorize deploying functions or installing packages on SCHOOL.

```mermaid
sequenceDiagram
    participant UI as Existing Connected UI
    participant DB as Authorized attachment RPCs / PostgreSQL
    participant GW as Authenticated image gateway
    participant ST as Private Supabase Storage
    UI->>DB: Reserve image attempt (user JWT, shipment UUID, expected revision, request UUID)
    DB-->>UI: Server-owned pending attachment and attempt identifiers
    UI->>GW: Image bytes + attempt ID + current user JWT
    GW->>DB: Recheck active actor, ownership/AAL2 and pending attempt
    GW->>GW: Enforce limits, decode, validate and sanitize
    GW->>ST: Write verified bytes under a new immutable key
    GW->>DB: Record server-only verification attestation
    UI->>DB: Finalize with original expected revision / request identity
    DB->>DB: Atomically activate new file, retire prior file, increment revision and append one audit event
    DB-->>UI: Minimal receipt; refetch authorized metadata
    UI->>ST: Authenticated download under Storage RLS
    ST-->>UI: Bytes for in-memory preview or explicit download
```

The gateway accepts only application attachment/attempt IDs; it resolves bucket/key from trusted state. It must never accept arbitrary destination keys, URLs to fetch, user IDs or `validated=true` from the browser. Confirm the signed JWT using the existing Auth verification mechanism, then obtain current protected account access. Secret/legacy service-role credentials stay server-side, outside React, `VITE_*`, logs and Git. Elevated Storage operations bypass RLS, so gateway authorization remains mandatory independently of bucket policies. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

Do not adopt direct signed-upload URLs by default. Supabase documents that these accept uploads without further authentication and last **two hours**, so they are not a five-minute revocable permission. If later needed, use an approved private quarantine design with verification before publication and account-revocation/race tests. Current small-file requirements do not justify that extra bearer-token path: [signed-upload contract](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

## Employee, administrator and Storage permissions

| Actor                                                 | View/download current image                                  | Reserve/upload/replace                                        | Detach / physical purge                                             |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Active employee                                       | Own non-deleted shipments only                               | Own non-deleted shipments only; no owner/start/number changes | Detach policy awaiting approval; physical purge denied              |
| Active administrator at AAL2                          | Any non-deleted shipment                                     | Any non-deleted shipment                                      | Audited logical detach under proposed policy; physical purge denied |
| Administrator at AAL1                                 | No operational attachment access                             | Denied                                                        | Denied                                                              |
| Inactive, unprovisioned, anonymous or expired session | Denied                                                       | Denied                                                        | Denied                                                              |
| Trusted validation/maintenance service                | Only necessary verified objects for its authorized operation | Server-controlled publication after independent authorization | Restricted maintenance only after retention/purge approval          |

Storage SELECT policy must match the exact bucket/key to an **available** metadata row and an authorized parent shipment, including current active account, AAL2 for admins and non-deleted state. Apply RLS to metadata as well as `storage.objects`; path prefixes or Storage uploader ownership alone do not prove shipment ownership. Expose only bounded, allowlisted metadata reads. Return the same generic unavailable response for missing and unauthorized IDs.

Deny browser Storage INSERT/UPDATE/DELETE, object overwrite/upsert, move/copy and arbitrary bucket listing. Database metadata/lifecycle writes use narrowly granted commands; do not grant direct table DML to employees or application administrators. Upload status for a pending attempt is visible only to its actor or an authorized admin, never as downloadable file content. Recheck access when reserving, receiving bytes, finalizing, replacing, detaching and requesting each download.

## Secure file processing and delivery

Client `accept`/size checks provide feedback; the server remains authoritative. Enforce actual streamed bytes even without a trustworthy Content-Length, request duration and per-actor rate/quota limits. Match allowed MIME to magic bytes **and successful full image decode**; reject malformed/truncated data, SVG disguised as PNG, unsupported animation and decompression bombs. Proposed processing cap: 20 megapixels and 8,192 pixels per dimension, to be validated against real phone/document samples before approval.

Re-encode with a reviewed, pinned library, strip EXIF/GPS and active metadata, and verify final byte size/checksum/type. Do not send invoices to a public scanning service. Decide whether approved private malware scanning is required; safe image decoding/re-encoding is not a blanket antivirus guarantee. If asynchronous scanning is chosen, add a private quarantine stage and extend estimates. Original-byte retention and whether the sanitized image is acceptable as the business invoice copy require explicit owner sign-off. These controls follow [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

For preview/download, prefer the user's JWT on Supabase's authenticated download API, then an in-memory Blob URL. Revoke Blob URLs and clear/cancel requests on dialog close, unmount, logout, account/session change and access denial; ignore late responses from prior sessions. Never put signed links or image bytes in localStorage, sessionStorage, shipment drafts, exports, service-worker/offline caches or telemetry. Select no-store/private caching for authorized responses where controllable and test actual response headers/CDN behavior; a previously downloaded copy cannot be remotely erased.

If a browser-specific preview requires a signed download URL, obtain owner acceptance of a short expiry (proposed 60 seconds), never persist/log/share it, and test expired-link refresh. A signed URL can remain valid after logout/deactivation until expiry; Auth-key rotation is not per-link revocation. Do not promise immediate revocation or delete retained files merely to invalidate URLs. See [private bucket access](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [serving/revoking signed URLs](https://supabase.com/docs/guides/storage/serving/downloads).

Provide a safe default download filename such as `Invoice-TR-0548.jpg`, with explicit Content-Type and nosniff where the response layer supports them. If an original display filename is stored, bound and sanitize it, strip path/control/bidi-override characters, escape it as text and prevent header injection while preserving normal Arabic text. Never render user HTML or embed an unvalidated remote URL.

## Database relationships and lifecycle changes to design

Reuse `invoice_files.shipment_id -> shipments.id` and `uploaded_by -> profiles.id`; authorization derives from the immutable shipment owner, not a duplicate mutable file owner. Replace the existing **one-current-image partial unique index** via a reviewed forward-only migration design; enforce **at most THREE available images per shipment** under a shipment row lock and count pending reservations, including concurrent attempts. Preserve required validated metadata. Use stable per-image IDs or named slots so replacing one does not retire the others. Candidate forward-only additions include server-controlled bucket identifier, sanitized display filename, detected dimensions, verified/retired timestamps and retirement actor/reason. Existing pending/available/rejected/retired states are sufficient unless asynchronous scanning adds a genuinely necessary state.

Plan a small private upload-attempt/verification record with attachment ID, authenticated actor/session binding, request UUID/fingerprint, expiry, expected shipment revision and trusted byte-verification result. Use existing idempotency principles with namespaced operations; do not store submitted image bytes or raw credentials in receipts. A verifier-only RPC records attestation after checking the actual object; the user-scoped finalize RPC must require it. The browser cannot forge an attestation by submitting its own checksum or MIME. All new entry points require explicit transport allowlists, fixed search paths, reviewed function ownership and restricted grants; no broad service-role table writes.

Lifecycle rules:

1. **Reserve:** validate active account, owner/admin AAL2, revision and quotas; allocate pending file/key. Reserve capacity transactionally so parallel attempts cannot evade quotas. A reservation alone does not change shipment state or create an attachment-history event.
2. **Validate/store:** authenticate again, bound/decode/re-encode bytes, compute server SHA-256, upload to the reserved new key without overwrite and record verification through the trusted path. Unpublished objects have no browser read policy.
3. **Finalize:** lock the shipment and pending attempt; recheck actor, parent deletion, AAL2, attestation and expected revision. For a replacement retire only the **selected** prior available image, or for a new addition validate current count < 3; activate new metadata in the same SQL transaction; increment the shared shipment revision and append **one** file-lifecycle event plus receipt. Do not touch UUID/TR number, original start, workflow/completion, owner or existing shipment-command behavior.
4. **Retry/conflict:** preserve exact request IDs/payload identity after an uncertain response; query attempt/receipt before uploading again. Reuse with different bytes is rejected. A failed replacement leaves the selected prior image usable, without changing the other two available images. A stale shipment revision returns an explicit conflict, preserving the user's selected file in memory; no silent overwrite.
5. **Detach/retire:** use an authorized, audited command under the approved removal policy. Retired metadata/history remains; retirement is not physical deletion. Shipment soft delete prevents new file reads, while restoration may expose the current image again if retention has preserved it.
6. **Reconcile/purge:** SQL and Storage cannot commit atomically. After failures, reconcile object presence/checksum and attempt state; treat missing available objects as an incident, not as successful uploads. Proposed pending-attempt expiry is 15 minutes and orphan grace at least 24 hours, subject to approval. Cleanup must list exact eligible keys, respect legal holds/retention, be idempotent and never remove current/referenced files, retained HOME records or active uploads. Physical removal uses the [Storage API, not SQL-only deletion](https://supabase.com/docs/guides/storage/management/delete-objects).

New attachment actions require extending the `shipment_events.action` constraint and Connected history parser/AR/EN labels in forward-only migrations/code. Recommended actions: `invoice_attached`, `invoice_replaced`, `invoice_detached`; one event per finalized revision, not two competing events for a replacement. Store file IDs, actor, server time, size/type/checksum and changed field names as appropriate, with no raw bytes or signed URLs. Existing completion events and report calculations must remain unchanged. Optional download-access logs should be separate from shipment modification history and describe authorization/response initiation, not falsely assert that a user saved the file successfully.

## Preview and mobile-first UI plan

Keep the approved form/layout, brand, 16px inputs/body, readable secondary text, 44px controls and AR RTL/EN LTR patterns. Add an optional **Invoice images (0–3)** section beside the independent invoice number, with **3 MiB per image** size guidance, individual thumbnails, Add/Replace buttons and admin-only Detach. Create the shipment first through the existing command; attach only after its server UUID is known. A failed image upload must say that the shipment saved and the attachment needs retry, without creating a duplicate shipment.

- Offer **Take photo** and **Choose image** through native file controls; camera capture is a progressive enhancement, not a forced mobile picker. Reject unsupported HEIC/PDF with a useful localized message and explain an approved conversion/compression path if provided.
- Show selected-file name/size and a local pre-upload preview, separate Add up to 3 / Replace selected image controls and Cancel, with per-image accessible progress/status and retry. Compression requires a readable confirmation preview; never silently crop invoice text. With the current small limit, standard whole-file retry is simpler than a resumable/TUS subsystem.
- Do not persist file bytes across refresh/logout. Explain that a refresh may require reselecting the file; an already submitted attempt can be recovered by its authorized receipt/status without blindly resending bytes.
- In details, lazy-load the current thumbnail after authorization; offer a labelled full preview dialog and explicit Download. Fit to viewport, preserve aspect ratio and allow usable zoom on a real phone. Supply alt text, dialog focus/return/Escape, keyboard access, visible focus and announced errors/progress. Avoid image loading in every shipment card/report row by default.
- Cover no-image, selected, uploading, validating, available, rejected, network loss, expired session, missing object, denied access, revision conflict, deleted parent and retired-image states. Replace/detach require confirmation and never remove the existing image until successful finalization.
- Readable errors must distinguish recoverable network failure from invalid files without exposing another employee's shipment or object key. Preserve entered text, draft recovery and existing command retry semantics. Default Demo remains unchanged; Connected bytes never enter Demo storage or CSV/daily preview emails.

### Approved multi-image security amendments (29 October 2026)

- Enforce max **3** available images in trusted PostgreSQL operations, never frontend-only. Race-test simultaneous attempts at the third/fourth slot, pending reservation quotas, idempotency and original authorizations.
- Every image has a separate UUID, immutable key, checksum, status, uploader, server timestamp and lifecycle history. Replace only the identified image; if replacement fails, keep existing images valid. Attach/detach commands use shared shipment revision and one audit event per finalized mutation.
- Three 3 MiB images require gateway total-request/decoded-pixel caps, per-user upload rate limits, concurrency limits, Storage usage monitoring and retention budgets. Existing 750 KiB schema cap and one-current-image unique index MUST NOT be silently bypassed.
- Test 0/1/2/3 available images, rejected fourth, exact 3,145,728-byte and +1-byte boundaries, PNG/JPEG/WebP, PDF/HEIC rejection, Android/iOS picker behavior and Arabic/English narrow-phone layouts. No new HOME fixture creation or deletion without scoped owner consent.

## Security and acceptance test plan — not executed on SCHOOL

| Boundary                    | Required evidence during approved implementation                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth/authorization          | Real signed sessions: employee A own read/upload/replace; employee A denied B's IDs/keys/metadata/listing; active admin AAL2 allowed; admin AAL1, inactive, unprovisioned, anonymous, expired/tampered JWT denied; metadata-role forgery ignored                          |
| Storage/SQL privilege paths | Private/public endpoint probes, bucket enumeration, guessed keys, direct SDK/REST writes, update/upsert/move/delete and direct metadata/audit edits denied; verifier RPC inaccessible to ordinary users; table/function/RLS grants reviewed                               |
| Validation                  | PNG/JPEG/WebP valid samples, exactly-at-limit and limit+1 bytes, no/false Content-Length, spoofed MIME/extension, polyglot/truncated/animated/oversized-pixel files, SVG/PDF/HEIC, unsafe filenames, EXIF/GPS stripping and output readability                            |
| Revocation/races            | Disable account or downgrade admin during upload; delete/restore parent during validation; simultaneous replacements; stale revisions; expired attempts; attempts bound to another actor/session; old Blob resources cleared on logout/account change                     |
| Consistency/recovery        | Crash/failure before/after object write and before/after SQL commit; lost final response; duplicate same/different payloads; orphan sweeper boundaries; missing object; quotas reserved/released correctly; at most THREE available images and one audit event per successfully finalized image mutation |
| Download/cache              | Authenticated byte access, expired/reused signed URLs if enabled, cache/header behavior, safe disposition names, download error/cancellation and no keys/URLs/bytes in logs, browser storage or client bundles                                                            |
| Regression/accessibility    | Existing shipment number/start/owner, manual Riyadh completion, strict >96h status, reopen/delete/restore/history/reports, session-bound drafts and Demo unaffected; AR/EN, RTL/LTR, themes, keyboard/focus and 320–430px mobile / desktop reflow                         |
| Physical devices/operations | Real Android Chrome and iPhone Safari camera/library/HEIC behavior, text clarity, picker cancellation, zoom/download and slow/offline network; separate metadata/object backup and restore rehearsal before production                                                    |

Use only approved disposable fixtures in an authorized non-production environment after verified backups and a narrow cleanup agreement. HOME's earlier test permissions do not authorize new fixtures or changes to retained records. Require the existing app/workflow, signed HTTP/Auth, PostgreSQL, both-build and credential-scan gates plus new attachment tests; do not replace them with mocks or source inspection. No new test pass is claimed by this planning document.

## Implementation milestones and estimated effort

Estimate **11–16 focused engineering days** for one developer familiar with the application, plus **2–3 days contingency** (about three to four working weeks including review). These are engineering estimates, not a fixed-price commitment. **The original 11–16-day estimate assumed ONE 750 KiB image and is NOT valid as a fixed estimate for the now-approved THREE 3 MiB images.** Re-estimate once the 4A gateway/codec and concurrency tests are scoped. The estimate still assumes existing Auth and an approved non-production verification environment. Owner response times, environment provisioning, paid services and a production release are excluded.

| Milestone                                               | Effort   | Reviewable exit gate                                                                                                                     |
| ------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 4A — policy, threat model and runtime/codec feasibility | 1–2 days | Sign off limits, permissions, fidelity/originals, region, retention, quotas and acceptance; approve dependencies/environment separately  |
| 4B.1 — schema/contracts and privilege design            | 2 days   | Forward-only migration review, lifecycle/receipt/CAS and audit design; backup/rollback plan; no broad write grants                       |
| 4B.2 — Storage, gateway and lifecycle commands          | 3–4 days | Real private upload, verified publication/replacement, authenticated download, failure recovery and retention-safe reconciliation tested |
| 4B.3 — existing UI integration                          | 2–3 days | Mobile-first optional upload, preview/download and all localized accessible states; Demo unchanged                                       |
| 4B.4 — adversarial/device acceptance and handoff        | 3–5 days | Signed HTTP/Storage/RLS tests, full regressions, actual Android/iPhone review, operations/runbook and independent security review        |

More than three current images, files over 3 MiB, HEIC/PDF support, originals plus derivatives, asynchronous malware scanning, resumable uploads or a new processing runtime require re-estimation. Keep scheduled email (4C), account recovery (4D) and production rollout (4E) outside this attachment slice. Each implementation milestone should use an explicitly approved development branch/PR; this existing branch remains planning only.

## Open decisions and release conditions

1. **RESOLVED:** maximum 3 available images per shipment, each ≤3 MiB (3,145,728 bytes), JPG/JPEG/PNG/WebP only; PDF and HEIC/HEIF excluded. **OPEN:** invoice readability standard, iPhone HEIC conversion guidance, whether originals are kept, and image ordering.
2. **RESOLVED:** employees upload/replace only their own invoice images; admin AAL2-only logical detach. **OPEN:** admin access to retired/deleted bytes and whether completed shipments need locking.
3. Select region/residency and separate staging/production ownership only at later provisioning approval. Agree per-account/project quotas, billing alerts and who pays; no subscription change is made now.
4. Approve image-processing runtime/library and private malware-scanning policy, including whether any third party may receive invoice data. Do not install or deploy them during planning.
5. Choose authenticated download as default or explicitly accept signed-link residual exposure/expiry. Define who may download/export and that saved copies cannot be remotely revoked.
6. Set business/legal retention, holds, purge authority, orphan thresholds and independent file backups. Supabase database backups contain object metadata, **not Storage file bytes**: [backup limitation](https://supabase.com/docs/guides/platform/backups). Define and rehearse recovery before production.
7. Approve a non-production verification environment and narrowly scoped fictional fixtures when implementation begins. HOME being off is not permission to create a SCHOOL database or cloud instance.
8. Publication workflow decision: `scripts/sync-end.ps1` currently requires database tests whenever the branch contains `supabase/migrations`, even for documentation-only changes. No database run, guard bypass or script modification is authorized here. A documented docs-only publication approval/path or later execution in the authorized environment is required before publishing these edits through that guard.

## SCHOOL execution record and stop point

This task inspected Git and source files, fetched GitHub, verified PRs #15/#16 and the approved ancestry, and prepared planning documents on the existing Phase 4 branch. Only documentation is changed. Validation for this task is document formatting, diff/scope and credential-pattern review; results are recorded in the latest `PROJECT_STATUS.md` entry. HOME's prior test totals are historical evidence, not SCHOOL results.

No HOME endpoint or database was contacted; no Docker/Supabase command, environment installation, migration, test fixture, new instance, deployment, DNS, credential or UI change was performed. Do not run the database-dependent publication guard to work around the powered-off HOME computer. Stop for architecture/business review and explicit implementation/publication decisions. **Keep PR #16 Draft and unmerged.**