# HOME localhost database repair — 27 October 2026

The user explicitly approved replacing only the API and PostgreSQL containers after backup, reusing the existing database volume and retaining stopped originals for rollback. The repair is complete on HOME. This does not approve PR merges, Phase 3C, production connections or deployment.

## Verified outcome

- API: `127.0.0.1:54321` → container TCP 8000. PostgreSQL: `127.0.0.1:54322` → container TCP 5432. Both Docker HostConfig/actual publication and Windows listening sockets show only IPv4 loopback; no wildcard or IPv6 publication remains for these ports.
- REST root and Auth health returned HTTP 200 using the local anonymous client key; anonymous shipment access returned HTTP 401. PostgreSQL answered protocol negotiation over localhost TCP.
- TCP probes from HOME succeeded through 127.0.0.1 and failed through HOME's Wi-Fi and WSL IPv4 interfaces and ::1. These were probes from this computer, not an independent physical LAN client test.
- A supported Docker stop/start of the replacement containers retained both loopback mappings, original internal network addresses and database state. A full Windows reboot was not performed.
- The same named PostgreSQL volume and database cluster were retained. Before tests, both migration records, all eight application-table contents, Auth users and sequence state exactly matched the baseline. After tests, table contents still matched; the sequence advanced normally from 48 to 64 through test use and was never reset.
- Both original generated API TLS files and declarative configuration, and PostgreSQL's pgsodium root key, were preserved and content-compared. No secret values were printed or committed. Auth and REST containers were not replaced or restarted.
- All eight tables still enable and force RLS. Migrations remain `20261027091000` and `20261027091100`; no migration was edited, replayed or added.

Fresh checks after repair:

| Check                  | Result                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| npm run test:db        | 20 passed, 0 failed, 0 skipped                                        |
| Local Supabase db lint | No schema errors                                                      |
| npm run check          | Formatting, Oxlint, 36 application tests, TypeScript and build passed |
| Existing Vite preview  | HTTP 200 at http://127.0.0.1:5173/; left running                      |

## Preservation and recovery inventory

The local custom-format backup was copied from PostgreSQL, its pg_restore inventory checked and its SHA-256 recorded. A restore was not performed or claimed tested. Private globals, full container snapshots, generated-file archives, repair state and logs are under the application's ignored `artifacts/network-security/` directory on HOME. They may contain local credentials/keys and must never be committed, uploaded or casually shared.

Backup file: `vs-approved-loopback-c0abdbd5dcdf.dump`.
SHA-256: `763a7b9dcae24feb533412525ade45d3489bd1a36c330e18bc252a27b5277524`.

Active containers retain the original names:

- `supabase_db_vision-solution-local`
- `supabase_kong_vision-solution-local`

Original containers are retained, stopped and disconnected from the application network:

- `supabase_db_vision-solution-local_rollback_c0abdbd5dcdf`
- `supabase_kong_vision-solution-local_rollback_c0abdbd5dcdf`

**Do not start a rollback database container while its replacement is running. They share one data directory.** Do not delete either originals or volumes as cleanup without approval. Do not use a project-label bulk cleanup command; the originals retain their original Supabase labels.

The API initially could not start without its generated TLS/configuration files. Those were copied from the retained original using owner-preserving Docker archives before successful verification. PostgreSQL's original generated key/configuration was also retained. Copying Config/HostConfig alone is insufficient for a repeat of this repair. No database initialization or backup restoration was used.

## Supported start/stop procedure for the existing containers

Use the existing dedicated `desktop-linux` context. Before starting, inspect both expected names and their creation-time publishing configuration. Fail if either is missing or any mapping differs; do not silently recreate them.

```powershell
$expected = @{
  'supabase_db_vision-solution-local' = @{ ContainerPort = '5432/tcp'; HostPort = '54322' }
  'supabase_kong_vision-solution-local' = @{ ContainerPort = '8000/tcp'; HostPort = '54321' }
}
foreach ($name in $expected.Keys) {
  $item = docker --context desktop-linux inspect $name | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0 -or $item.Count -ne 1) { throw "Missing or ambiguous container: $name" }
  $ports = @($item.HostConfig.PortBindings.PSObject.Properties)
  if ($ports.Count -ne 1 -or $ports[0].Name -ne $expected[$name].ContainerPort) { throw "Unexpected published ports: $name" }
  $bindings = @($ports[0].Value)
  if ($bindings.Count -ne 1 -or $bindings[0].HostIp -ne '127.0.0.1' -or $bindings[0].HostPort -ne $expected[$name].HostPort) {
    throw "Unsafe publishing configuration: $name"
  }
}
docker --context desktop-linux start supabase_db_vision-solution-local
if ($LASTEXITCODE -ne 0) { throw 'Database start failed' }
# Wait for healthy before starting API; inspect until Status is healthy.
docker --context desktop-linux inspect supabase_db_vision-solution-local --format '{{.State.Health.Status}}'
# Run this only after the preceding status reads healthy:
docker --context desktop-linux start supabase_kong_vision-solution-local
docker --context desktop-linux inspect supabase_kong_vision-solution-local --format '{{.State.Health.Status}}'
```

Auth and REST normally keep running under their existing restart policies. If either is stopped, inspect its original identity and use Docker start on that existing container; do not bootstrap a new stack. For an intentional stop of the publishing services, stop API first, then PostgreSQL, with a graceful timeout; never stop the Vite preview as part of this operation.

```powershell
docker --context desktop-linux stop --time 60 supabase_kong_vision-solution-local
docker --context desktop-linux stop --time 60 supabase_db_vision-solution-local
```

After startup, inspect actual Ports and Windows listeners, verify REST/Auth readiness and run `npm run test:db` from the Phase 3B checkout. Use `127.0.0.1` explicitly; IPv6 localhost was deliberately not published.

## Limits and future recreation

The pinned Supabase CLI 2.122.0 has no explicit publish-host flag. The documented Docker bridge-default option was tested but ineffective in this HOME runtime. The successful repair uses officially supported explicit Docker publishing. No daemon settings, registry, Windows firewall rules or guessed Supabase TOML fields were changed. See [Docker publishing documentation](https://docs.docker.com/engine/network/port-publishing/).

Do not run `npm run db:stop`, `supabase stop`, stack recreation or project-label cleanup while preserving this recovery inventory: the CLI may remove retained containers or recreate wildcard publications. Docker start/stop of the existing named containers is the tested path. Future CLI upgrades, fresh stacks and SCHOOL setup require inspection and a separate safe recreation procedure; this HOME runtime repair is not a portable CLI configuration or a SCHOOL certification.

Rollback remains available but is not executed. If requested, stop both replacements, verify no PostgreSQL process uses the volume, retain/rename the replacements, reconnect originals with their saved aliases/internal addresses and restore their original names before starting database then API. Review the private snapshot first. The originals' publishing settings are wildcard, so restarting them would undo network containment and must be explicitly acknowledged. Do not restore a dump over the existing database or run two PostgreSQL containers on the same volume.

Application source, browser storage, migrations, Git branches and PR merge status were unchanged by the repair. No Phase 3C implementation has started.
