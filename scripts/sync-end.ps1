#Requires -Version 5.1
[CmdletBinding()]
param(
    [string[]]$Files = @(),
    [string]$CommitMessage,
    [switch]$AuthorizeCommit,
    [switch]$AuthorizePush,
    [switch]$ConfirmReviewed,
    [switch]$StatusReviewed,
    [switch]$IncludeDatabaseTests
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sync-common.ps1')
try {
    $repo = Get-SyncRepository (Join-Path $PSScriptRoot '..')
    Assert-SyncDevelopmentBranch $repo
    Show-SyncStatus $repo
    Write-Host 'Update PROJECT_STATUS.md with actual tests, pending approvals and the previous verified checkpoint. Never invent the current commit hash.'
    if (-not $StatusReviewed) { throw 'Review/update PROJECT_STATUS.md, then explicitly pass -StatusReviewed.' }
    if (-not (Test-Path -LiteralPath (Join-Path $repo.Root 'docs/PROJECT_STATUS.md'))) { throw 'PROJECT_STATUS.md is required before publishing. Do not copy unrelated branch files without review.' }
    Invoke-SyncGit $repo.Root @('fetch', 'origin') | Write-Host
    $tracking = Get-SyncTracking $repo -AllowMissing
    $remoteRef = 'refs/heads/' + $repo.Branch
    $remoteLines = @(Invoke-SyncGit $repo.Root @('ls-remote', '--heads', 'origin', $remoteRef))
    if ($tracking) {
        $divergence = Get-SyncDivergence $repo $tracking
        if ($divergence.Behind -gt 0) { throw 'Remote work is ahead or divergent. Preserve local work and synchronize deliberately before publishing.' }
    } elseif ($remoteLines.Count -gt 0) { throw 'A remote branch exists without matching local tracking. Review it before publishing.' }
    $staged = @(Invoke-SyncGit $repo.Root @('diff', '--cached', '--name-only'))
    if ($staged.Count -gt 0) { throw 'The index already contains staged work. Review it manually; this script will not mix commits or unstage it.' }
    Invoke-SyncGit $repo.Root @('diff', '--check') | Write-Host
    if ($AuthorizeCommit) {
        if (-not $ConfirmReviewed -or [string]::IsNullOrWhiteSpace($CommitMessage) -or $Files.Count -eq 0) {
            throw 'Committing requires explicit files, message, -AuthorizeCommit and -ConfirmReviewed.'
        }
        $normalized = @()
        foreach ($file in $Files) {
            if ([IO.Path]::IsPathRooted($file) -or $file -match '(^|[\\/])\.\.([\\/]|$)') { throw 'Select explicit repository-relative files only.' }
            $relative = $file.Replace('\', '/')
            $fullPath = Join-Path $repo.Root $relative
            if (Test-Path -LiteralPath $fullPath -PathType Container) { throw 'Select individual files, not folders or wildcards.' }
            if ($relative -match '[*?\[\]]') { throw 'Wildcards are not permitted.' }
            $normalized += $relative
        }
        $normalized = @($normalized | Select-Object -Unique)
        Assert-SyncSafeFiles $normalized
        $pending = @(Invoke-SyncGit $repo.Root @('ls-files', '--modified', '--deleted', '--others', '--exclude-standard')) | Select-Object -Unique
        $unrelated = @($pending | Where-Object { $_ -notin $normalized })
        if ($unrelated.Count -gt 0) { throw 'Unselected local changes remain. Isolate or review the approved work; nothing was staged.' }
        foreach ($file in $normalized) {
            if ($file -notin $pending) { throw 'A selected file has no pending change. Nothing was staged.' }
            if ((Test-Path -LiteralPath (Join-Path $repo.Root $file)) -and (Get-Item -LiteralPath (Join-Path $repo.Root $file)).Attributes.ToString().Contains('ReparsePoint')) { throw 'Symlinks/reparse points require manual review.' }
        }
        Assert-SyncNoSecrets $repo $normalized
    } else { Assert-SyncClean $repo }
    Push-Location -LiteralPath $repo.Root
    try {
        & npm.cmd run check
        if ($LASTEXITCODE -ne 0) { throw 'Project checks failed; no commit/push was performed.' }
        if ($IncludeDatabaseTests) {
            & npm.cmd run test:db
            if ($LASTEXITCODE -ne 0) { throw 'Database verification failed; no commit/push was performed.' }
        } elseif (Test-Path -LiteralPath 'supabase/migrations') {
            throw 'This branch contains database migrations. Run with -IncludeDatabaseTests; no database test bypass is provided.'
        }
    } finally { Pop-Location }
    if ($AuthorizeCommit) {
        Assert-SyncNoSecrets $repo $normalized
        Invoke-SyncGit $repo.Root (@('add', '--') + @($normalized | ForEach-Object { ':(literal)' + $_ })) | Write-Host
        Invoke-SyncGit $repo.Root @('diff', '--cached', '--check') | Write-Host
        $stagedNow = @(Invoke-SyncGit $repo.Root @('diff', '--cached', '--name-only'))
        if (@(Compare-Object ($normalized | Sort-Object) ($stagedNow | Sort-Object)).Count -ne 0) { throw 'The staged file set changed; review the index manually.' }
        Invoke-SyncGit $repo.Root @('commit', '-m', $CommitMessage) | Write-Host
    }
    Assert-SyncClean $repo
    if (-not $AuthorizePush) { Write-Host 'Checks complete. Nothing was pushed. Use -AuthorizePush only after explicit user authorization.'; exit 0 }
    if (-not $ConfirmReviewed) { throw 'Publishing also requires -ConfirmReviewed for all outgoing commits.' }
    $range = 'HEAD'
    if ($tracking) { $range = "$tracking..HEAD" }
    else {
        $base = @(Invoke-SyncGit $repo.Root @('merge-base', 'HEAD', 'origin/main')) -join ''
        $range = "$base..HEAD"
    }
    $outgoing = @(Invoke-SyncGit $repo.Root @('rev-list', $range))
    foreach ($commit in $outgoing) {
        $commitFiles = @(Invoke-SyncGit $repo.Root @('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-m', '--diff-filter=ACMRT', $commit) | Select-Object -Unique)
        Assert-SyncSafeFiles $commitFiles
        Assert-SyncNoSecrets $repo $commitFiles $commit
    }
    # Normal push only: concurrent remote changes are rejected by Git.
    Invoke-SyncGit $repo.Root @('push', '--set-upstream', 'origin', ('HEAD:' + $remoteRef)) | Write-Host
    $head = (Invoke-SyncGit $repo.Root @('rev-parse', 'HEAD')) -join ''
    $remote = @(Invoke-SyncGit $repo.Root @('ls-remote', '--heads', 'origin', $remoteRef))
    if ($remote.Count -ne 1 -or ($remote[0] -split '\s+')[0] -ne $head) { throw 'Push verification failed. Do not claim a successful backup.' }
    Write-Host "VERIFIED: $($repo.Branch) local and remote $head"
} catch { Write-Error $_; exit 1 }
