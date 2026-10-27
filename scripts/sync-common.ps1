#Requires -Version 5.1
# Shared guards. No credentials, database commands, resets or automatic stashes.
function Invoke-SyncGit {
    param([string]$Root, [string[]]$Arguments)
    $output = @(& git -c core.quotepath=false -C $Root @Arguments)
    if ($LASTEXITCODE -ne 0) { throw 'Git command failed. Resolve the reported error before continuing.' }
    return $output
}

function Get-SyncRepository {
    param(
        [string]$Root,
        [string[]]$AllowedRemotes = @(
            'https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system.git',
            'git@github.com:a7mdel5taeeb-eng/vision-solution-shipment-system.git'
        )
    )
    $rootPath = (Resolve-Path -LiteralPath $Root).Path
    $gitRoot = (Invoke-SyncGit $rootPath @('rev-parse', '--show-toplevel')) -join ''
    if ([IO.Path]::GetFullPath($gitRoot) -ne [IO.Path]::GetFullPath($rootPath)) {
        throw 'The script must belong to the repository root, not an enclosing checkout.'
    }
    $urls = @(Invoke-SyncGit $rootPath @('config', '--get-all', 'remote.origin.url'))
    $fetchUrls = @(Invoke-SyncGit $rootPath @('remote', 'get-url', '--all', 'origin'))
    $pushUrls = @(Invoke-SyncGit $rootPath @('remote', 'get-url', '--push', '--all', 'origin'))
    if ($urls.Count -ne 1 -or $urls[0] -notin $AllowedRemotes -or
        $fetchUrls.Count -ne 1 -or $fetchUrls[0] -notin $AllowedRemotes -or
        $pushUrls.Count -ne 1 -or $pushUrls[0] -notin $AllowedRemotes) {
        throw 'Origin must identify only the Vision & Solution application repository. No remote was changed.'
    }
    $branch = (Invoke-SyncGit $rootPath @('symbolic-ref', '--quiet', '--short', 'HEAD')) -join ''
    if (-not $branch) { throw 'Detached HEAD: select the approved development branch manually.' }
    foreach ($marker in @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer')) {
        $markerPath = (Invoke-SyncGit $rootPath @('rev-parse', '--git-path', $marker)) -join ''
        if (-not [IO.Path]::IsPathRooted($markerPath)) { $markerPath = Join-Path $rootPath $markerPath }
        if (Test-Path -LiteralPath $markerPath) { throw 'An unfinished Git operation needs manual review.' }
    }
    return [pscustomobject]@{ Root = $rootPath; Branch = $branch }
}

function Assert-SyncClean {
    param($Repository)
    $changes = @(Invoke-SyncGit $Repository.Root @('status', '--porcelain', '--untracked-files=all'))
    if ($changes.Count -ne 0) { throw 'Local tracked or untracked work exists. Preserve and review it; nothing was stashed or overwritten.' }
}

function Get-SyncTracking {
    param($Repository, [switch]$AllowMissing)
    $tracking = (Invoke-SyncGit $Repository.Root @('for-each-ref', '--format=%(upstream:short)', ('refs/heads/' + $Repository.Branch))) -join ''
    if (-not $tracking) {
        if ($AllowMissing) { return $null }
        throw 'No upstream is configured. Review the intended origin branch and set tracking manually.'
    }
    $expected = 'origin/' + $Repository.Branch
    if ($tracking -ne $expected) { throw 'Upstream does not match the active branch on origin; review manually.' }
    return $expected
}

function Get-SyncDivergence {
    param($Repository, [string]$Tracking)
    $counts = ((Invoke-SyncGit $Repository.Root @('rev-list', '--left-right', '--count', "HEAD...$Tracking")) -join '').Trim() -split '\s+'
    return [pscustomobject]@{ Ahead = [int]$counts[0]; Behind = [int]$counts[1] }
}

function Assert-SyncDevelopmentBranch {
    param($Repository)
    if ($Repository.Branch -in @('main', 'master') -or
        $Repository.Branch -notmatch '^(feature|chore|fix|docs|test|codex|qa)[/-]') {
        throw 'Publishing requires an explicitly selected development branch. This script never writes main/master.'
    }
}

function Assert-SyncSafeFiles {
    param([string[]]$Paths)
    foreach ($file in $Paths) {
        if ($file -match '(^|/)(node_modules|dist|dist-ssr|build|coverage|artifacts|secrets|credentials|uploads|exports|local-data|backups|\.aws|\.ssh|\.codex|\.agents)(/|$)' -or
            $file -match '(^|/)\.env($|\.)|(^|/)\.npmrc$|(^|/)credentials[^/]*\.json$|service-account[^/]*\.json$|\.(pem|key|p12|pfx|sqlite3?|db|dump|bak)$|(^|/)id_(rsa|ed25519)' -or
            $file -match '[\r\n\t"]|[\x00-\x1f]' -or $file -match '^[-:]') {
            throw 'A sensitive, generated or unsupported path was selected. Review locally; no content was printed.'
        }
    }
}

function Assert-SyncNoSecrets {
    param($Repository, [string[]]$Paths, [string]$Tree)
    $pattern = '(?i)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}|https?://[^\s/@:]+:[^\s/@]+@|(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["\x27][^"\x27\r\n]{8,}["\x27]'
    foreach ($file in $Paths) {
        if ($Tree) { $lines = @(Invoke-SyncGit $Repository.Root @('show', ($Tree + ':' + $file))) }
        else {
            $fullPath = Join-Path $Repository.Root $file
            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) { continue }
            $lines = @(Get-Content -LiteralPath $fullPath)
        }
        if (($lines -join "`n") -match $pattern) {
            throw 'Potential credential content detected. Review selected files locally; no secret content was printed.'
        }
    }
}

function Show-SyncStatus {
    param($Repository)
    Write-Host "Repository: $($Repository.Root)"
    Write-Host "Branch: $($Repository.Branch)"
    & git -C $Repository.Root status --short --branch
    & git -C $Repository.Root log -1 --format='%H %s'
    Write-Host 'Existing stashes (never applied automatically):'
    & git -C $Repository.Root stash list
    Write-Host 'Worktrees:'
    & git -C $Repository.Root worktree list
    $statusFile = Join-Path $Repository.Root 'docs/PROJECT_STATUS.md'
    if (Test-Path -LiteralPath $statusFile) { Get-Content -LiteralPath $statusFile | Write-Host }
    else { Write-Warning 'PROJECT_STATUS.md is absent on this branch. Read its reviewed maintenance PR and the branch checkpoint before work.' }
}
