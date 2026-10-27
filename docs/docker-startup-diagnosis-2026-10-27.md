# HOME Docker startup diagnosis — 27 October 2026

Scope: diagnose the reported Docker Desktop launcher error after the user restarted Windows for WSL installation. No application source, migration, registry value, Windows feature or existing Docker data was changed as a repair. No reinstall/uninstall or database reset was performed.

## Evidence

- Windows 11 Pro build 26300; hypervisor present. An elevated read-only feature query confirmed VirtualMachinePlatform Enabled. The optional Windows Subsystem for Linux component was Disabled; WSL 3.0.3/default version 2 and its Linux kernel subsequently ran successfully. WSL1 was not required or enabled. CPU capability fields returned false under the active hypervisor and were not treated as evidence that firmware virtualization had become disabled.
- Docker Desktop 4.97.0.244584 was installed in **per-user** mode. Installer logs explicitly record the selected WSL2 backend, per-user components, successful registration stage and installation success. The HKCU uninstall record identifies the same location/version; no all-users installation was found.
- Expected location: `%LOCALAPPDATA%\Programs\DockerDesktop`. Root and frontend launchers, `resources\com.docker.backend.exe`, diagnostics binary and CLI are present. Inspected executable signatures are valid and identify Docker. Current-user file permissions include full control.
- The exact `SOFTWARE\Docker Inc.\Docker Desktop` key from the reported error is absent under HKCU and HKLM in both registry views. It remains absent while the engine is running. The HKCU uninstall record, startup registration and both shortcuts are present; shortcuts resolve to the correct per-user root launcher. No stale Program Files target was found.
- The installation advertises NoRepair=1 and NoModify=1. No undocumented repair switch or guessed registry values were used. A missing `com.docker.service` is expected in per-user WSL2 mode, not proof of failed installation.
- Initial read-only engine probes found no daemon pipe or running Docker processes. No registered WSL distributions, Docker WSL data directory or virtual disks were present in the inspected/default locations. Storage-related settings did not identify a custom data location.

## Recovery and root-cause limits

The supported `docker desktop start --timeout 15` command initiated startup. It returned a timeout, but subsequent CLI and log checks confirmed the Linux engine completed startup after about 16.7 seconds. Docker Desktop's visible Containers dashboard reports **Engine running**. The first CLI timeout was a startup-duration result, not a failed final engine state.

The confirmed symptom is a launcher registry lookup against an absent key in a per-user installation with intact files. There is no evidence of a duplicate installation, an access-denied failure on those binaries, or a current WSL2 failure. The exact reason the original launch path requested the key is **not established**; registry absence alone is not sufficient to explain all startup paths because the supported CLI path works without restoring it. A similar error is tracked in [Docker's Windows issue #14912](https://github.com/docker/for-win/issues/14912); that report does not prove an identical cause or a guaranteed fix here.

Use the documented [Docker Desktop start command](https://docs.docker.com/reference/cli/docker/desktop/start/), allowing sufficient first-start time, and verify `docker desktop status` plus `docker info`. A reboot-persistent shortcut fix has not been proven. Do not call this a repaired registry installation or guarantee that the original shortcut error cannot recur.

## Verified operational state on HOME

| Check                    | Executed result                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Desktop UI and CLI state | Visible Engine running; `docker desktop status` reports running                                              |
| Engine                   | 29.9.2, linux/x86_64, local desktop-linux named-pipe context                                                 |
| WSL2                     | docker-desktop Running, version 2; `uname` reports Linux 6.18.54.1-microsoft-standard-WSL2                   |
| Compose                  | 5.6.1; an in-memory configuration validated successfully without creating a Compose test stack               |
| Initial engine inventory | Zero images, containers, volumes and build cache before project setup                                        |
| Linux containers         | Dedicated Supabase PostgreSQL, Auth, REST and gateway containers running after the approved setup resumed    |
| Local PostgreSQL         | 17.11; both committed Phase 3B migrations recorded; subsequent migration-up applied no additional migration  |
| Database security tests  | Fresh HOME run: 20 passed, zero failed/skipped; all eight tables enable and force RLS                        |
| Database lint            | No schema errors; empty results/warnings list                                                                |
| Fixture cleanup          | Zero profiles, Auth users, shipments, shipment events and command receipts after the suite                   |
| Frontend                 | npm run check passed: formatting, Oxlint, 36 tests, TypeScript and build; pinned Impeccable CheckOnly passed |
| Preview                  | Persistent npm run dev on port 5173; root and daily-report HTTP probes returned 200                          |

Database role/claim tests do not verify production authentication, HTTP JWT validation, real MFA enrollment/recovery or private Storage. The frontend remains browser-local and independent of Supabase. PR #5 is unmerged; Phase 3C is not started.

## Preservation and any future repair

Docker startup created new WSL virtual disks. They now exist at `%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx` and `%LOCALAPPDATA%\Docker\wsl\main\ext4.vhdx`. The approved project stack now owns local containers and volumes. They must be preserved in any future repair; do not reuse the initial empty-engine observation as permission to delete current data.

No reinstall is justified while the verified start path works. If the original launcher failure recurs:

1. Recheck the current installation, exact error, registry views and engine state read-only; preserve logs locally rather than uploading a diagnostic bundle automatically.
2. Inventory current containers/images/volumes if the engine is accessible. If it cannot start, locate the actual VM disks and any custom storage paths. Plan a stopped-state backup of disks and local configuration, outside Git, with hashes; never print or commit configuration secrets.
3. Obtain explicit approval before stopping workloads, uninstalling, reinstalling, switching installation mode or restoring configuration. This diagnosis grants no destructive-repair approval.
4. Use Docker's official installer/uninstaller procedures. Do not invent registry values, delete leftovers, unregister WSL distributions or reset the engine. No supported in-place repair was established for this installed NoRepair=1 package. If a reinstall is approved, preserve data first and verify the selected mode deliberately; do not switch modes silently.
5. Verify Desktop, engine, Linux containers, Compose, WSL2 and the preserved local database before resuming development.

Docker documents that [per-user mode uses HKCU and does not install the privileged helper service](https://docs.docker.com/desktop/setup/install/windows-permission-requirements/). Its [backup guidance](https://docs.docker.com/desktop/settings-and-maintenance/backup-and-restore/) requires Docker to be stopped before copying VM disks. Its [uninstall guidance](https://docs.docker.com/desktop/uninstall/) warns that uninstalling can destroy containers, images and volumes. Consequently no uninstall or speculative repair was attempted.

Raw local diagnostic logs, screenshots and generated runtime output remain in ignored artifacts; they are not committed. This report records only sanitized findings and test outcomes.
