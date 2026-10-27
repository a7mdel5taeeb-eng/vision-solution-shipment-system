#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [switch]$SkipHooks
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$pin = Get-Content -LiteralPath (Join-Path $projectRoot '.impeccable/toolchain.json') -Raw | ConvertFrom-Json
if ($pin.skillVersion -notmatch '^\d+\.\d+\.\d+$' -or
    $pin.bundleUrl -ne "https://github.com/pbakaus/impeccable/releases/download/skill-v$($pin.skillVersion)/universal.zip" -or
    $pin.bundleSha256 -notmatch '^[a-f0-9]{64}$') {
    throw 'Invalid Impeccable toolchain pin; review .impeccable/toolchain.json.'
}
foreach ($tool in @('git', 'node', 'npm.cmd', 'npx.cmd')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Required tool missing: $tool. Install Git and Node.js 22.12+ (npm 10+) first."
    }
}
$nodeVersion = [version]((& node --version).Trim().TrimStart('v'))
$npmVersion = [version]((& npm.cmd --version).Trim())
if ($nodeVersion -lt [version]'22.12.0' -or $npmVersion.Major -lt 10) {
    throw 'This project requires Node.js 22.12+ and npm 10+.'
}

Push-Location -LiteralPath $projectRoot
$priorBundle = [Environment]::GetEnvironmentVariable('IMPECCABLE_BUNDLE_PATH', 'Process')
try {
    $gitRoot = & git rev-parse --show-toplevel
    if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($gitRoot.Trim()) -ne $projectRoot) {
        throw 'Run this script from a clone of the project; its scripts folder must be in the repository root.'
    }
    $skillDir = Join-Path $projectRoot '.agents/skills/impeccable'
    $skillFile = Join-Path $skillDir 'SKILL.md'
    $launcher = Join-Path $skillDir 'scripts/impeccable.cmd'
    if (-not (Test-Path -LiteralPath $skillDir)) {
        if ($CheckOnly) { throw 'Impeccable is missing. Run this script without -CheckOnly to install.' }
        # The official installer supports a local bundle. Pin the bundle too:
        # pinning npm alone still resolves the latest remote skill bundle.
        $cacheDir = Join-Path $projectRoot '.impeccable/cache'
        New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
        $bundleFile = Join-Path $cacheDir "universal-$($pin.skillVersion).zip"
        if (-not (Test-Path -LiteralPath $bundleFile)) {
            Write-Host "Downloading approved Impeccable $($pin.skillVersion) bundle..."
            Invoke-WebRequest -UseBasicParsing -Uri $pin.bundleUrl -OutFile $bundleFile
        }
        if ((Get-FileHash -LiteralPath $bundleFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pin.bundleSha256) {
            throw "Bundle checksum mismatch. Preserved $bundleFile for inspection; no installation was attempted."
        }
        $env:IMPECCABLE_BUNDLE_PATH = $bundleFile
        & npx.cmd --yes "impeccable@$($pin.skillVersion)" install --yes --providers=codex --scope=project --no-hooks
        if ($LASTEXITCODE -ne 0) { throw 'Official Impeccable installer failed; existing project files were preserved.' }
    } else {
        Write-Host 'Existing Impeccable installation found; preserving it.'
    }
    foreach ($required in @($skillFile, $launcher, (Join-Path $skillDir 'reference/audit.md'), (Join-Path $skillDir 'scripts/engine-checksums.txt'))) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
            throw "Incomplete installation: $required. No existing files will be replaced automatically."
        }
    }
    $skillText = Get-Content -LiteralPath $skillFile -Raw
    $match = [regex]::Match($skillText, '(?m)^\s+version:\s*([^\s]+)\s*$')
    if (-not $match.Success -or $match.Groups[1].Value -ne $pin.skillVersion) {
        throw "Installed skill differs from approved version $($pin.skillVersion). Review it manually; setup never forces an update."
    }
    $engine = & $launcher engine-probe
    if ($LASTEXITCODE -ne 0 -or ($engine -join '').Trim() -ne "impeccable-engine $($pin.engineVersion)") {
        throw 'Engine validation failed. Check network access, release availability, and any IMPECCABLE_BIN override.'
    }
    if (-not $SkipHooks) {
        $hooksFile = Join-Path $projectRoot '.codex/hooks.json'
        if ($CheckOnly) {
            if (-not (Test-Path -LiteralPath $hooksFile)) { throw 'Codex hook manifest is missing; rerun setup without -CheckOnly.' }
            $hooksText = Get-Content -LiteralPath $hooksFile -Raw
            $null = $hooksText | ConvertFrom-Json
            if ($hooksText -notmatch 'impeccable') { throw 'Codex hook manifest has no Impeccable entry; rerun setup.' }
        } else {
            # Official hook setup merges provider manifests; unrelated hooks survive.
            & $launcher hooks on
            if ($LASTEXITCODE -ne 0) { throw 'Skill installed, but hook setup failed. Review .codex/hooks.json and retry.' }
        }
    }
    Write-Host "Verified Impeccable skill $($pin.skillVersion), engine $($pin.engineVersion), project scope."
    Write-Host 'Open/reopen the repository in Codex. The skill is available on the next turn. Approve the hook through /hooks if your Codex build prompts for trust.'
    Write-Host 'Use $impeccable audit. PRODUCT.md and .impeccable/config.json remain the shared product context and code-first default.'
} finally {
    [Environment]::SetEnvironmentVariable('IMPECCABLE_BUNDLE_PATH', $priorBundle, 'Process')
    Pop-Location
}
