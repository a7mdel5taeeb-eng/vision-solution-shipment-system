# Phase 3B PR review and localhost network investigation

Reviewed 27 October 2026, Asia/Riyadh. This report does not authorize merging or Phase 3C implementation.

**Historical review:** the OPEN PR/head references below describe the original review. PR #6 was subsequently approved and merged as `9224acc3be9d9bbc2b2f5c0d7329ef10b5d235cb`, and the user authorized its integration into PR #5. The database candidate still requires separate merge approval. Read [PROJECT_STATUS](PROJECT_STATUS.md) and PR #5 for current integration results and the verified source checkpoint.

## Local network finding and tested approaches

The installed Supabase CLI is pinned to **2.122.0**. Its actual start help supports a custom `--network-id`, but no host-bind-address flag. The existing API 54321 and PostgreSQL 54322 containers have empty HostIp in their published-port configuration; Docker resolves them to `0.0.0.0` and `::`.

Docker documents a user-defined bridge option, `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, for the default address of published ports. Supabase documents use of a custom Docker network. Both were investigated before touching the project stack:

| Disposable proof                                                                       | Actual result on this HOME Docker build                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Move an existing volume-free container onto a loopback-default bridge                  | Container identity preserved, but published addresses stayed wildcard                |
| Gracefully restart that same container after moving networks                           | Published addresses still wildcard                                                   |
| Create a fresh container directly on a bridge with the verified loopback driver option | Driver option was stored correctly, but Docker still published on wildcard addresses |
| Create a fresh container with explicit `127.0.0.1:host-port:container-port`            | Docker reported localhost-only publication                                           |

The proofs used uniquely labeled sleep containers based on an already-downloaded image, with no volumes or database process. Only those proof containers/networks were removed afterward. At the end of those disposable proofs, all four original Supabase containers, their network attachments and the PostgreSQL volume remained unchanged. The subsequent approved repair is recorded below. A documented setting that failed in this runtime must not be reported as a successful fix.

Official references: [Docker default/published addresses](https://docs.docker.com/engine/network/port-publishing/), [network connect](https://docs.docker.com/reference/cli/docker/network/connect/), [network disconnect](https://docs.docker.com/reference/cli/docker/network/disconnect/), [Supabase CLI network-id](https://supabase.com/docs/reference/cli/introduction).

## Original preservation proposal and subsequent approval

No supported in-place rebind preserving current container identities was demonstrated. Explicit port mapping worked only in a new container definition. The user subsequently explicitly approved replacing only API/PostgreSQL containers after backup, retaining the volume and stopped originals for rollback. **That HOME repair is now implemented and verified.** See the [repair/restart runbook](home-localhost-repair-2026-10-27.md) for exact preservation evidence, fresh test results and the CLI recreation limitation. The original proposal below is retained for context; it is no longer a pending approval.

The proposed boundary is explicit `127.0.0.1` mappings, not a guessed Supabase configuration property, an internal Docker file edit, a database reset, or an unapproved firewall change. Before an approved replacement:

1. Recheck the live baseline; make a local database backup and private inspect snapshot, outside Git. A read-only custom-format database backup has already been copied and SHA-256 verified under ignored local artifacts. It is not uploaded or included in this report.
2. Retain the existing named PostgreSQL volume. Preserve original container configurations and keep original publishing containers stopped/renamed for rollback rather than deleting them. Never run two PostgreSQL processes against the same data directory.
3. Use supported Docker container configuration with explicit loopback publication, the exact existing image/configuration and original database volume. Do not initialize a new database, apply duplicate migrations or restore over existing data.
4. Verify database cluster identity, mounts, applied migrations, data/sequence state and health before the test suite. Then run 20 database integration tests, schema lint and localhost REST/Auth connectivity. Probe non-loopback access and inspect both Docker bindings and Windows listeners; report anything not independently verified.
5. Document the start/recovery procedure so a later Supabase stop/start cannot silently restore wildcard publication. The pinned CLI's lack of an explicit publish-host setting and this engine's ineffective bridge default remain portability constraints. Do not call a one-off runtime workaround a durable HOME/SCHOOL fix without testing it.

The approved repair verified Docker publication and Windows listeners restricted to 127.0.0.1, successful localhost connectivity and failed HOME Wi-Fi/WSL-interface probes. Fresh post-repair tests passed 20/20 database and 36/36 application cases, schema lint and full checks. RLS remains distinct from the network boundary. Only fictional local data is authorized; this is not production clearance. Existing-container stop/start was verified, but future CLI recreation may undo publishing settings.

## PR #5 — Phase 3B Database Foundation

Reviewed head `f290bfe0ae47126da1d56d08d56ff50c1a59291d`: two outgoing commits, 14 changed files. GitHub reports OPEN, non-draft and MERGEABLE/CLEAN against current main. No GitHub CI runs or submitted reviews are recorded.

- Reviewed the two migrations, grants/RLS/definer boundaries, command/read contracts, database harness, pinned dependencies, configuration and runbook. The application frontend/public assets have zero changes from the approved main baseline.
- All eight tables have enabled and forced RLS. Protected writer/access-reader roles cannot log in, bypass RLS or act as superusers. Actor/role checks, immutable fields, transaction revisioning, request receipts and audit append behavior are exercised by the existing real PostgreSQL suite.
- The fresh HOME verification already recorded 20/20 database tests and 36/36 application tests with schema lint and build passing. Additional test results for this review are reported separately; no school outcome is substituted for a HOME run.
- Scanned the changed tree and every outgoing commit for credential patterns and disallowed committed paths; zero matches found. No generated CLI state, environment file, dump, operational export or raw diagnostic log is in the reviewed diff. Test identities use fictional example.invalid addresses; these tests do not create real passwords or send email.

**Verdict:** the database implementation is ready for functional approval review; no new SQL correctness defect was identified in this review. The HOME localhost boundary has since been verified and a safe existing-container restart procedure documented. CLI recreation and SCHOOL portability still require their own review; the environment is not production-hardened or approved for real data. Do not silently edit applied migrations to solve a host networking issue. HTTP Auth/JWT/MFA, account administration, Storage, adapter integration and production readiness remain future scope, not a passing Phase 3B claim.

## PR #6 — Cross-Computer Development Workflow

Reviewed initial head `86ebefb2ddb95061c804cec3377b73db3cb345d9`: four outgoing commits, 10 changed files before this review's documentation additions. GitHub reports OPEN, non-draft and MERGEABLE/CLEAN against current main, without CI runs or submitted reviews.

- Reviewed repository/upstream identity guards, dirty/staged/unrelated-file protection, ignored-file preservation, fast-forward-only behavior, divergence handling, explicit file/commit/push authorization, credential checks and remote-hash verification.
- **20/20 offline Windows PowerShell 5.1 workflow tests passed again during this review.** These exercise HOME/SCHOOL-style Git transfers with isolated local repositories. They do not certify software installations or database state on the physical SCHOOL computer.
- Scanned changed committed files and every outgoing commit; zero credential-pattern or disallowed-path matches. No application source, public asset or database implementation changes are included.
- No blocking synchronization logic defect was identified. Explicit human authorization remains required for publication; script switches cannot authorize an agent themselves.

**Verdict:** ready for workflow approval review, with the approved HOME networking repair and remaining CLI recreation limitation accurately documented. New planning/review documents remain documentation only. Both PRs change AGENTS/README, so approved integration must deliberately reconcile those instructions and rerun checks; individual mergeability does not establish a conflict-free combined result. Do not merge either PR automatically.

## Product continuation

The [proposed Phase 3C plan](phase-3c-implementation-plan.md) divides work into five independently testable slices: local sessions, protected accounts/MFA and HTTP security, typed reads, transactional commands, then full connected workflow/persistence acceptance. Demo mode stays the default and existing browser data remains untouched. No Phase 3C implementation, shared cloud backend or production service is created by this review.
