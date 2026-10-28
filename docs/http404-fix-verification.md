# Shipment-command HTTP 404 fix — local verification

Verified on HOME, 28 October 2026. Existing branch `fix/shipment-command-not-found-http-404`, draft [PR #11](https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system/pull/11). GitHub main contains the approved Phase 3C.2 merge `ae60413b427a86ba82bf3812be1791eac20827bd`. The clean checkout safely switched to PM checkpoint `ddbaa44bb6b062321f245fa6144a63b373a70e31` without discarding work or overwriting ignored files.

## Reviewed change

The forward-only migration `20261028060000_shipment_command_not_found_http.sql` replaces the same-signature `public.shipment_command` function. Mechanical comparison of the original, proposed and installed function bodies confirmed exactly two substitutions: SQLSTATE `P0002` becomes `PT404`, retaining the generic `record_unavailable` message. These are the missing/invisible row path and the inaccessible cached-request replay path. All business rules, locking, revision checks, ownership, audit and idempotency logic remain identical. The descriptive function comment is intentionally updated.

PostgREST officially supports `PTxyz` SQLSTATE values for the corresponding HTTP status: [custom HTTP errors](https://docs.postgrest.org/en/latest/references/errors.html#raise-errors-with-http-status-codes). Fresh signed-JWT HTTP tests verified the actual 404 response; this conclusion does not rely on static SQL review alone.

## Backup and application

1. Captured the existing cluster, application-row digests, identity/password and MFA-factor fingerprints, service/container identities/images/mounts/port bindings, RLS flags/policies, grants, function OID/owner/ACL/security configuration, sequence value and three applied migration versions. Only private fingerprints were inspected; no credential material was printed.
2. Created a fresh private custom-format PostgreSQL dump under ignored `artifacts/network-security/`. SHA-256 matched the database-container copy and local copy. `pg_restore --list` verified the archive inventory, including shipment, audit, protected-access, MFA and migration objects. This is a verified backup copy/inventory, not a destructive restoration exercise.
3. Confirmed exactly one pending migration, then executed the pinned CLI's `migration up --local`. Only `20261028060000` was applied. No reset, restore, container recreation, volume operation or hosted command was used.
4. Compared the live state with the pre-migration baseline immediately afterward and after test-fixture cleanup. Function OID, owner `vs_command_writer`, ACL, SECURITY DEFINER and search path were unchanged; only the two intended SQLSTATE values changed. Existing table rows, identity/password/MFA fingerprints, RLS policies/grants, cluster/volume and all required service identities/bindings matched. Sequence values advanced normally through tests and were never reset.

Private backup and baseline records remain local/ignored and must never be uploaded. Existing applied Phase 3B/3C.2 migration files were not edited. The local database now contains this unmerged forward migration; use this fix branch for its matching tests. Do not reset or rewrite history to make an older branch's HTTP 500 assertions pass.

## Actual results

| Check                                          | Executed result                                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Real signed-JWT HTTP/security tests            | **15 passed, 0 failed, 0 skipped**                                                                             |
| Auth integration                               | **13 passed, 0 failed, 0 skipped**                                                                             |
| PostgreSQL integration                         | **20 passed, 0 failed, 0 skipped**                                                                             |
| Application/unit tests                         | **53 passed, 0 failed**                                                                                        |
| Workflow integration                           | **20 passed**, byte-identical scripts in isolated disposable repositories                                      |
| npm run check                                  | Formatting, Oxlint, application tests, TypeScript, default production build and browser credential scan passed |
| Connected production build and credential scan | Passed                                                                                                         |
| Local schema lint at warning level             | No schema errors, empty results                                                                                |
| Security/data preservation                     | Pre/post migration and post-fixture baseline checks passed                                                     |

The PM branch adds the owner/EXECUTE-grant regression to the earlier 13-case security suite. HOME added one focused cached-request replay case, making the actual count 15. All tests use their own fictional local fixtures and clean up only those fixtures. They do not recreate or reset retained accounts, credentials, MFA factors or operational records. These are HOME execution results, not historical SCHOOL evidence or GitHub CI claims.

## Verified HTTP contract

| Request                                                                                         | Actual behavior                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Well-formed nonexistent shipment UUID                                                           | HTTP **404**, `PT404`, `record_unavailable`                               |
| Other employee's inaccessible shipment UUID                                                     | Identical HTTP **404** and error body; no existence disclosure            |
| Cached create-request replay after the shipment becomes soft-deleted/inaccessible               | Identical HTTP **404**; shipment, audit and receipt fingerprint unchanged |
| Authorized cached create-request replay before deletion                                         | HTTP **200**, identical successful result; idempotency retained           |
| Malformed UUID                                                                                  | HTTP **400**, validation behavior preserved                               |
| Inactive/missing account, administrator AAL1 operational request, employee deletion/restoration | Existing permission denial retained                                       |
| Tampered or expired signed JWT                                                                  | Existing HTTP **401** boundary retained                                   |

The security suites also verify employee A/B REST/RPC/history/invoice isolation, forged metadata rejection, real administrator TOTP/AAL2, immediate deactivation, denied direct writes, immutable audit data and restricted function ownership/EXECUTE grants. Database regressions verify transactional audit, optimistic concurrency, idempotency, strict 96-hour status, completion/reopening, soft deletion/restoration and phone validation. Unauthorized edits and replay leave no partial mutation or receipt/audit artifact.

## Scope and approval

No UI, frontend/domain/persistence code, dependency, production setting or runtime configuration was changed. Approved Demo and Connected previews remain operational. No deployment, PR merge or Phase 3C.3 implementation occurred.

Update [PROJECT_STATUS.md](PROJECT_STATUS.md), publish reviewed non-sensitive files to this existing branch, verify the remote SHA and update PR #11. Keep the PR Draft and unmerged until separate project-manager approval. The HTTP 500 finding is resolved in this locally verified candidate; production/connected-shipment implementation remains a later approved milestone.
