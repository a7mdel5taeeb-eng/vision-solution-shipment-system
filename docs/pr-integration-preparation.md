# PR #6 → PR #5 integration preparation

Prepared 27 October 2026, Asia/Riyadh. This document is an integration strategy, not permission to merge either PR or start Phase 3C.

## Execution update after explicit approval

The user subsequently approved merging PR #6 and updating PR #5, but not merging PR #5. PR #6 was merged with the approved-head guard at `98367b751c0570a0a4bcd3d8f13be2fd2b84dc3d`; GitHub and local/remote main were verified at the actual merge commit `9224acc3be9d9bbc2b2f5c0d7329ef10b5d235cb`. The database feature branch now integrates that main with the AGENTS conflict resolved, both instruction sets preserved and README/restart guidance reconciled. Fresh combined-candidate checks passed 20 database tests, schema lint, 36 application tests/full checks and 20 workflow tests (isolated byte-identical-source run after a Windows fixture lock).

See [PROJECT_STATUS](PROJECT_STATUS.md) and the updated PR #5 description for the current published checkpoint and remaining separate merge approval. The original preparation sections below record the pre-merge state and strategy; they are historical, not a claim that PR #6 is still open. The Phase 3C plan and all database/frontend/workflow implementations remain unchanged.

## Verified base and scope

- Stable `origin/main`: `7fb40c9bfde944a6f7c3cee57da822a164801890`.
- PR #6, `chore/cross-computer-development-workflow`: previous verified checkpoint `14a140d2b1ed0274fa24b203175fcdcc7927bbb0`. This preparation adds documentation/instructions only; scripts and implementation remain unchanged.
- PR #5, `feature/phase-3b-database-foundation`: `f290bfe0ae47126da1d56d08d56ff50c1a59291d`. The database branch remains unchanged, synchronized and unmerged.
- Both PRs are individually mergeable against the current main. The combined `git merge-tree --write-tree` simulation reports a content conflict in `AGENTS.md`; `README.md` merges automatically but needs semantic reconciliation. This simulation does not move branches, check out files or perform a real merge.
- The latest executed HOME final review passed 20/20 PostgreSQL integration tests, 36/36 application tests and 20/20 Windows workflow tests. Formatting, Oxlint, TypeScript and production build passed. Changed trees and all outgoing commits had no credential-pattern/disallowed-path matches; neither PR changes the approved frontend. Database authentication tests use SQL claims; real JWT/MFA integration remains future work. No GitHub CI checks are recorded.
- HOME localhost restriction is complete and verified; see the [preservation and restart runbook](home-localhost-repair-2026-10-27.md). It is not a new installation task or proof that future CLI recreation will retain bindings.

## Gate 1 — PR #6 approval and actual merge

PR #6 is ready for merge approval after its description reflects the completed HOME repair and current documentation. The user must explicitly approve merging #6. Until then, do not merge either PR and do not update the PR #5 branch from a speculative integration tree.

After an approved #6 merge actually occurs, fetch origin, read the merged PR metadata and record its real merge commit. Verify that `origin/main` includes that commit and the expected reviewed files. The `merge_commit_sha` shown while a PR is still open can refer to GitHub's test merge; it is not evidence of an actual approved merge. Do not assume a particular merge/squash/rebase method or invent the future main hash.

## Gate 2 — safely update PR #5 after verified main

The user has conditionally requested the branch update after Gate 1 is satisfied. It is not performed by this preparation milestone.

1. Inspect the database checkout, expected origin/upstream, status, ignored-file collisions, unfinished operations, stashes/worktrees and divergence. Stop on local work, unexpected remote changes or conflicting history. Never stash, reset, clean, force-switch or force-push automatically.
2. Safely synchronize the tracked database branch. Merge the verified `origin/main` into the existing Phase 3B feature branch, preserving published history. Do not rebase published commits or merge the database feature into main at this step.
3. Resolve `AGENTS.md` by retaining the architecture/bilingual/UI boundaries, database migration and RLS/authorization requirements, full workflow/synchronization safeguards, central GitHub reporting and explicit approval gates. Replace the conflicting phase-status sentence with a truthful post-#6/pre-#5 state: workflow is approved/merged; Phase 3B remains a candidate until separately merged; Phase 3C is unapproved. Do not accept either entire file wholesale.
4. Review the automatically merged `README.md`. Preserve setup/commands and describe the combined branch accurately. Link the verified HOME restart guidance instead of recommending generic CLI recreation on this existing stack. Update `docs/PROJECT_STATUS.md` for the real #6 main commit and the still-unmerged database candidate. Keep older verification reports clearly historical.
5. Preserve both applied migration files byte-for-byte, all database grants/policies, tests and protected roles. Preserve the approved frontend, demo persistence, shared date/i18n/router architecture, branding and the existing Phase 3C plan. Integrating workflow instructions is not approval to connect React to the database.
6. Run `npm run test:db`, local schema lint, `npm run check` and `powershell.exe -NoProfile -File scripts/test-sync-workflow.ps1` on the combined database branch. Confirm recorded migrations and forced RLS; no reset, duplicate migration replay or database recreation. If dependencies unexpectedly require npm ci, arrange authorized preview interruption/restart first; do not reinstall preemptively.
7. Review the combined diff and outgoing commits for sensitive content and correct scope. Commit/push the approved branch-integration result normally, verify the remote SHA, and update PR #5 with the actual main baseline, conflict resolution, test results, remaining work and verified checkpoint. Stop for separate PR #5 merge approval.

## Remaining approvals and reporting

- Approval to merge PR #6 remains required.
- PR #5 integration is conditional on the actual verified #6 merge; PR #5 merge requires a separate later approval after the combined revision passes review.
- Phase 3C implementation needs separate approval. Keep its [existing plan](phase-3c-implementation-plan.md) unchanged.
- At every approved milestone, publish the status document and relevant PR description or explicitly authorized summary comment, with actual results and a verified source checkpoint. Source/documentation transfer through GitHub; secrets, browser records, backups, volumes and runtime files do not.
- No infrastructure setup, database reset, production connection, deployment or public website change is part of this preparation.
