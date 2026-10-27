#Requires -Version 5.1
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sync-common.ps1')
try {
    $repo = Get-SyncRepository (Join-Path $PSScriptRoot '..')
    Show-SyncStatus $repo
    Assert-SyncClean $repo
    $tracking = Get-SyncTracking $repo
    Invoke-SyncGit $repo.Root @('fetch', 'origin') | Write-Host
    $divergence = Get-SyncDivergence $repo $tracking
    Write-Host "Ahead: $($divergence.Ahead); behind: $($divergence.Behind)"
    if ($divergence.Ahead -gt 0 -and $divergence.Behind -gt 0) { throw 'Branches diverged. Preserve both histories and review; no merge was attempted.' }
    if ($divergence.Behind -gt 0) {
        Assert-SyncDevelopmentBranch $repo
        # Git aborts if an ignored local file would be overwritten by the fast-forward.
        Invoke-SyncGit $repo.Root @('-c', 'merge.overwriteIgnore=false', 'merge', '--ff-only', '--no-overwrite-ignore', $tracking) | Write-Host
        Assert-SyncClean $repo
    }
    if ($divergence.Ahead -gt 0) { Write-Warning 'Local commits have not been backed up. Review and use sync-end with explicit authorization before leaving.' }
    Show-SyncStatus $repo
    Write-Host 'Confirm the approved task and latest branch checkpoint before editing. No branch was switched.'
} catch { Write-Error $_; exit 1 }
