#Requires -Version 5.1
# Offline integration tests. Only new disposable repositories under ignored artifacts/ are used.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$sourceScripts = $PSScriptRoot
$fixtureRoot = Join-Path (Join-Path $PSScriptRoot '../artifacts/sync-tests') ([guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixtureRoot -Force | Out-Null
$passed = 0
function Test-Case {
    param([string]$Name, [scriptblock]$Test)
    & $Test
    $script:passed++
    Write-Host "PASS: $Name"
}
function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}
function Assert-Throws {
    param([scriptblock]$Action)
    $threw = $false
    try { & $Action | Out-Null } catch { $threw = $true }
    Assert-True $threw 'Expected a safety guard to reject the operation.'
}
function Git-Fixture {
    param([string]$Root, [string[]]$Arguments)
    $priorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { $result = @(& git -C $Root @Arguments 2>&1); $code = $LASTEXITCODE }
    finally { $ErrorActionPreference = $priorPreference }
    if ($code -ne 0) { throw "Fixture Git operation failed: $($result -join ' ')" }
    return $result
}
# Native stderr is captured locally only; no fixtures contain real credentials.
$remote = Join-Path $fixtureRoot 'remote.git'
$repoRoot = Join-Path $fixtureRoot 'checkout'
$peerRoot = Join-Path $fixtureRoot 'peer'
& git init --bare --initial-branch=feature/workflow-test $remote | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Fixture remote init failed.' }
& git init --initial-branch=feature/workflow-test $repoRoot | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Fixture checkout init failed.' }
Git-Fixture $repoRoot @('config', 'user.name', 'Workflow test') | Out-Null
Git-Fixture $repoRoot @('config', 'user.email', 'workflow@example.invalid') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $repoRoot 'scripts'),(Join-Path $repoRoot 'docs') | Out-Null
foreach ($file in @('sync-common.ps1', 'sync-start.ps1', 'sync-end.ps1')) {
    $text = Get-Content -LiteralPath (Join-Path $sourceScripts $file) -Raw
    if ($file -eq 'sync-common.ps1') {
        # Replace only the repository identity in this disposable copy so real Git never contacts GitHub.
        $text = $text.Replace('https://github.com/a7mdel5taeeb-eng/vision-solution-shipment-system.git', $remote.Replace('\', '/'))
    }
    Set-Content -LiteralPath (Join-Path $repoRoot "scripts/$file") -Value $text -Encoding UTF8
}
Set-Content -LiteralPath (Join-Path $repoRoot 'docs/PROJECT_STATUS.md') -Value '# Fictional test status'
Set-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Value '{"scripts":{"check":"node -e \"process.exit(0)\""}}'
Set-Content -LiteralPath (Join-Path $repoRoot '.gitignore') -Value "ignored.txt`n.env*"
Git-Fixture $repoRoot @('add', '.') | Out-Null
Git-Fixture $repoRoot @('commit', '-m', 'Create fictional fixture') | Out-Null
Git-Fixture $repoRoot @('remote', 'add', 'origin', $remote.Replace('\', '/')) | Out-Null
Git-Fixture $repoRoot @('push', '-u', 'origin', 'feature/workflow-test') | Out-Null
Git-Fixture $repoRoot @('update-ref', 'refs/remotes/origin/main', 'HEAD') | Out-Null
. (Join-Path $sourceScripts 'sync-common.ps1')
$repo = Get-SyncRepository $repoRoot -AllowedRemotes @($remote.Replace('\', '/'))
$shell = (Get-Command powershell.exe -ErrorAction Stop).Source
function Run-FixtureScript {
    param([string]$Name, [string[]]$Arguments = @())
    $priorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { $output = @(& $shell -NoProfile -File (Join-Path $repoRoot "scripts/$Name.ps1") @Arguments 2>&1); $code = $LASTEXITCODE }
    finally { $ErrorActionPreference = $priorPreference }
    return [pscustomobject]@{ ExitCode = $code; Output = $output -join "`n" }
}
Test-Case 'PowerShell 5.1 parses all workflow scripts' {
    foreach ($file in @('sync-common.ps1', 'sync-start.ps1', 'sync-end.ps1')) {
        $tokens = $null; $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $sourceScripts $file), [ref]$tokens, [ref]$errors)
        Assert-True ($errors.Count -eq 0) 'Script parse failed.'
    }
}
Test-Case 'wrong repository is rejected' { Assert-Throws { Get-SyncRepository $repoRoot } }
Test-Case 'clean tracked branch starts without changes' {
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -eq 0) $result.Output
}
Test-Case 'dirty work stops start and remains untouched' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'pending.txt') -Value 'unsaved'
    $before = (Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join ''
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -ne 0 -and (Test-Path (Join-Path $repoRoot 'pending.txt'))) 'Dirty work was not preserved.'
    Assert-True (((Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join '') -eq $before) 'HEAD moved.'
    Git-Fixture $repoRoot @('add', 'pending.txt') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Keep fixture work') | Out-Null
}
Test-Case 'ahead-only branch remains ahead without automatic push' {
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -eq 0) $result.Output
    $counts = Get-SyncDivergence $repo 'origin/feature/workflow-test'
    Assert-True ($counts.Ahead -eq 1 -and $counts.Behind -eq 0) 'Ahead commit changed.'
}
Test-Case 'sync-end checks without push authorization never uploads' {
    $before = (Git-Fixture $repoRoot @('ls-remote', '--heads', 'origin', 'feature/workflow-test')) -join ''
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed')
    Assert-True ($result.ExitCode -eq 0) $result.Output
    Assert-True (((Git-Fixture $repoRoot @('ls-remote', '--heads', 'origin', 'feature/workflow-test')) -join '') -eq $before) 'Unexpected push.'
}
Test-Case 'explicit reviewed push verifies exact remote hash' {
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed', '-AuthorizePush', '-ConfirmReviewed')
    Assert-True ($result.ExitCode -eq 0 -and $result.Output.Contains('VERIFIED:')) $result.Output
}
Test-Case 'sensitive and generated paths are rejected' {
    foreach ($path in @('.env', '.env.production', 'dist/index.html', 'node_modules/x/a.js', 'credentials.json', 'secrets/key.txt', 'private.pem', '.agents/skills/a.md')) {
        Assert-Throws { Assert-SyncSafeFiles @($path) }
    }
}
Test-Case 'credential scan rejects content without printing the credential' {
    $token = 'ghp_' + ('a' * 36)
    Set-Content -LiteralPath (Join-Path $repoRoot 'credential-fixture.txt') -Value $token
    Assert-Throws { Assert-SyncNoSecrets $repo @('credential-fixture.txt') }
    # Overwrite only this newly created fictional fixture; no user file is involved.
    Set-Content -LiteralPath (Join-Path $repoRoot 'credential-fixture.txt') -Value 'redacted fictional fixture'
    Git-Fixture $repoRoot @('add', 'credential-fixture.txt') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Keep redacted fixture') | Out-Null
}
Test-Case 'unselected changes prevent automatic staging and commit' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'approved.txt') -Value 'approved'
    Set-Content -LiteralPath (Join-Path $repoRoot 'unrelated.txt') -Value 'unrelated'
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed', '-AuthorizeCommit', '-ConfirmReviewed', '-CommitMessage', 'test', '-Files', 'approved.txt')
    Assert-True ($result.ExitCode -ne 0) 'Unrelated work was allowed.'
    Assert-True (@(Git-Fixture $repoRoot @('diff', '--cached', '--name-only')).Count -eq 0) 'Files were staged unexpectedly.'
    Git-Fixture $repoRoot @('add', 'approved.txt', 'unrelated.txt') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Preserve both fixture files') | Out-Null
}
Test-Case 'authorized exact-file commit works without implicit push' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'approved.txt') -Value 'approved update'
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed', '-AuthorizeCommit', '-ConfirmReviewed', '-CommitMessage', 'Approved fixture update', '-Files', 'approved.txt')
    Assert-True ($result.ExitCode -eq 0) $result.Output
    Assert-SyncClean $repo
}
Test-Case 'existing staged work is preserved and rejected' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'approved.txt') -Value 'staged update'
    Git-Fixture $repoRoot @('add', 'approved.txt') | Out-Null
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed')
    Assert-True ($result.ExitCode -ne 0) 'Existing staged work was accepted.'
    Assert-True (@(Git-Fixture $repoRoot @('diff', '--cached', '--name-only')).Count -eq 1) 'Index was changed.'
    Git-Fixture $repoRoot @('commit', '-m', 'Preserve staged fixture') | Out-Null
    Git-Fixture $repoRoot @('push', 'origin', 'feature/workflow-test') | Out-Null
}
Test-Case 'failed project checks stop publication' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Value '{"scripts":{"check":"node -e \"process.exit(8)\""}}'
    Git-Fixture $repoRoot @('add', 'package.json') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Failing check fixture') | Out-Null
    $before = (Git-Fixture $repoRoot @('ls-remote', '--heads', 'origin', 'feature/workflow-test')) -join ''
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed', '-AuthorizePush', '-ConfirmReviewed')
    Assert-True ($result.ExitCode -ne 0) 'Failed checks were ignored.'
    Assert-True (((Git-Fixture $repoRoot @('ls-remote', '--heads', 'origin', 'feature/workflow-test')) -join '') -eq $before) 'Failed checks allowed a push.'
    Set-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Value '{"scripts":{"check":"node -e \"process.exit(0)\""}}'
    Git-Fixture $repoRoot @('add', 'package.json') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Restore passing fixture check') | Out-Null
}
Test-Case 'a database branch cannot skip its separate integration suite' {
    $migrationFixture = Join-Path $repoRoot 'supabase/migrations'
    New-Item -ItemType Directory -Path $migrationFixture -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $migrationFixture 'fixture.sql') -Value '-- Fictional guard test; never applied to a database.'
    Git-Fixture $repoRoot @('add', 'supabase/migrations/fixture.sql') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Database gate fixture') | Out-Null
    $result = Run-FixtureScript 'sync-end' @('-StatusReviewed')
    Assert-True ($result.ExitCode -ne 0 -and $result.Output.Contains('IncludeDatabaseTests')) 'Database testing was silently skipped.'
    Rename-Item -LiteralPath (Join-Path $repoRoot 'supabase') -NewName 'archived-database-fixture'
    Git-Fixture $repoRoot @('add', '-A', '--', 'supabase', 'archived-database-fixture') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Preserve database guard fixture in archive') | Out-Null
    Git-Fixture $repoRoot @('push', 'origin', 'feature/workflow-test') | Out-Null
}
& git clone --quiet $remote $peerRoot
if ($LASTEXITCODE -ne 0) { throw 'Fixture peer clone failed.' }
Git-Fixture $peerRoot @('config', 'user.name', 'Peer test') | Out-Null
Git-Fixture $peerRoot @('config', 'user.email', 'peer@example.invalid') | Out-Null
Test-Case 'behind-only branch fast-forwards without a merge commit' {
    Set-Content -LiteralPath (Join-Path $peerRoot 'peer.txt') -Value 'school update'
    Git-Fixture $peerRoot @('add', 'peer.txt') | Out-Null
    Git-Fixture $peerRoot @('commit', '-m', 'School fixture update') | Out-Null
    Git-Fixture $peerRoot @('push', 'origin', 'feature/workflow-test') | Out-Null
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -eq 0) $result.Output
    Assert-True (((Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join '') -eq ((Git-Fixture $peerRoot @('rev-parse', 'HEAD')) -join '')) 'Fast-forward did not reach peer.'
}
Test-Case 'ignored local files are never overwritten by fast-forward' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'ignored.txt') -Value 'preserve local data'
    Set-Content -LiteralPath (Join-Path $peerRoot 'ignored.txt') -Value 'remote fixture'
    Git-Fixture $peerRoot @('add', '-f', 'ignored.txt') | Out-Null
    Git-Fixture $peerRoot @('commit', '-m', 'Track collision fixture') | Out-Null
    Git-Fixture $peerRoot @('push', 'origin', 'feature/workflow-test') | Out-Null
    $before = (Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join ''
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -ne 0) 'Ignored collision was not blocked.'
    Assert-True ((Get-Content (Join-Path $repoRoot 'ignored.txt') -Raw).Trim() -eq 'preserve local data') 'Ignored data was overwritten.'
    Assert-True (((Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join '') -eq $before) 'Collision moved HEAD.'
}
Test-Case 'divergence stops without merging either history' {
    Set-Content -LiteralPath (Join-Path $repoRoot 'local.txt') -Value 'home update'
    Git-Fixture $repoRoot @('add', 'local.txt') | Out-Null
    Git-Fixture $repoRoot @('commit', '-m', 'Home fixture update') | Out-Null
    $before = (Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join ''
    $result = Run-FixtureScript 'sync-start'
    Assert-True ($result.ExitCode -ne 0) 'Divergence was merged.'
    Assert-True (((Git-Fixture $repoRoot @('rev-parse', 'HEAD')) -join '') -eq $before) 'Local history changed.'
}
Test-Case 'missing upstream requires deliberate configuration' {
    $untrackedBranch = [pscustomobject]@{ Root = $repoRoot; Branch = 'feature/no-upstream' }
    Assert-Throws { Get-SyncTracking $untrackedBranch }
    Assert-True ($null -eq (Get-SyncTracking $untrackedBranch -AllowMissing)) 'Missing tracking was fabricated.'
}
Test-Case 'a mismatched upstream is rejected' {
    $other = [pscustomobject]@{ Root = $repoRoot; Branch = 'feature/other-branch' }
    Git-Fixture $repoRoot @('branch', 'feature/other-branch', 'origin/feature/workflow-test') | Out-Null
    Assert-Throws { Get-SyncTracking $other }
}
Test-Case 'main branch publication is rejected' {
    $main = [pscustomobject]@{ Root = $repoRoot; Branch = 'main' }
    Assert-Throws { Assert-SyncDevelopmentBranch $main }
}
Write-Host "Workflow integration tests: $passed passed. Fictional repositories preserved at $fixtureRoot"
