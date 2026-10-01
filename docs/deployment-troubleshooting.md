# Deployment Troubleshooting Log

This document records issues found while getting the Docker Compose deployment
(`TourOfHeroes.AppHost` → `aspire deploy`) working end to end, what caused
them, and how they were fixed. See `docs/frontend.md` and `docs/backend.md`
for the original implementation logs.

## Issue 1 — Frontend called a placeholder API URL in production

**Symptom:** After deploying, the browser app couldn't reach any API
endpoints through the gateway.

**Cause:** `frontend/src/environments/environment.ts` (the production
environment file, used by the default `ng build` configuration) had
`apiBaseUrl` hard-coded to a placeholder external domain:

```ts
apiBaseUrl: 'https://api.tourofheroes.example.com/api';
```

The gateway (`AddYarp` + `PublishWithStaticFiles`) serves the built static
frontend and proxies `/api/**` to the API service on the *same origin*, so
the frontend must call a relative path, not an external host.

**Fix:** Changed `apiBaseUrl` to `/api`, matching
`environment.development.ts` (used by `ng serve` via `proxy.conf.js`):

```ts
apiBaseUrl: '/api';
```

**Gotcha:** This value is compiled into the JS bundle at build time. Editing
the source alone doesn't update an already-built `frontend/dist` folder or an
already-built Docker image — see Issue 3.

## Issue 2 — Angular build output layout breaks YARP static file serving

**Symptom:** After fixing Issue 1 and redeploying, the gateway returned
`404` for `/` even though the container had frontend files copied into
`/app/wwwroot`.

**Cause:** Angular's `@angular/build:application` builder writes output to
`dist/<project-name>/browser/` by default (e.g.
`dist/frontend/browser/index.html`). Aspire's YARP integration
(`PublishWithStaticFiles`) expects the static site's build output directly
under `dist/`, and copies that root into the gateway's `wwwroot` — so
`index.html` ended up at `wwwroot/frontend/browser/index.html` instead of
`wwwroot/index.html`.

This matches Aspire's own guidance (see "Framework output reference" in the
Aspire docs — `deploy-javascript-apps`): for Angular, `outputPath` in
`angular.json` must be set so the build writes to `dist/` directly.

**Fix:** In `frontend/angular.json`, under `architect.build.options`:

```json
"outputPath": {
  "base": "dist",
  "browser": ""
}
```

This makes `ng build` write `index.html`, JS/CSS bundles, etc. directly into
`dist/`, matching what the gateway expects.

## Issue 3 — `aspire publish` does not build anything

**Symptom:** After changing `environment.ts`, running `aspire publish`
produced no updated `dist/` folder, and the deployed gateway kept serving
old JS bundles.

**Cause:** For this Docker Compose target, `aspire publish` only
regenerates `aspire-output/docker-compose.yaml` and `.env*` files (a few
milliseconds, no Docker/npm activity). It does **not** run `ng build` or
build any container images.

Run `aspire deploy --list-steps` to see the actual pipeline — the
`build-frontend`, `build-api`, and `build-gateway` steps (which do the real
`ng build` / `docker build` work) only exist in the `aspire deploy`
pipeline, not in `aspire publish`.

**Fix / takeaway:** Use `aspire deploy` (not `aspire publish`) to pick up
frontend/backend source changes in the running Docker Compose deployment.
If a stale `frontend/dist` exists from a previous manual build, delete it
first so `aspire deploy` is forced to produce a fresh build.

## Issue 4 — API returns 500 with "Login failed for user 'sa'"

**Symptom:** After Issues 1–3 were fixed, the gateway correctly serves the
frontend and proxies `/api/**` to the `api` service, but API calls return
`500`. The `api` container logs show:

```
Microsoft.Data.SqlClient.SqlException (0x80131904): Login failed for user 'sa'.
Error Number:18456,State:1,Class:14
```

and the `sql` container logs confirm the exact reason:

```
Error: 18456, Severity: 14, State: 8.
Login failed for user 'sa'. Reason: Password did not match that for the login provided.
```

**Confirmed cause:** The `sql` resource uses `WithDataVolume()`
(`AppHost.cs`), so its data directory (`/var/opt/mssql`) persists across
deploys in a named Docker volume (e.g.
`aspire-docker-compose-<id>_tourofheroes.apphost-<hash>-sql-data`). SQL
Server only applies `MSSQL_SA_PASSWORD` the *first* time it initializes an
empty data volume. By default, Aspire generates a new random `SQL_PASSWORD`
parameter on every `aspire deploy`/`aspire publish` run and writes it to
`aspire-output/.env.Production`. Once the volume already contains an
initialized SQL Server instance, that new password no longer matches the
one baked into `master` the first time around — so every subsequent login
attempt fails with 18456, even though both containers are healthy and
reachable on the network.

Confirm this is the cause by checking whether the mounted volume predates
the current `.env.Production` password:

```powershell
docker inspect <sql-container-name> --format "{{json .Mounts}}"
docker volume ls | Select-String "sql-data"
Get-Content TourOfHeroes.AppHost\aspire-output\.env.Production | Select-String SQL_PASSWORD
```

If the volume already existed before the current password was generated,
this is the cause.

**Fix (quick, destructive to existing SQL data):** Force SQL Server to
re-initialize with the current password by removing its data volume, then
recreate the container:

```powershell
docker compose -f TourOfHeroes.AppHost\aspire-output\docker-compose.yaml stop sql
docker compose -f TourOfHeroes.AppHost\aspire-output\docker-compose.yaml rm -f sql
docker volume rm <project>_tourofheroes.apphost-<hash>-sql-data
aspire deploy   # or: docker compose ... up -d sql, then restart api/gateway
```
Re-run any pending EF Core migrations afterwards (the AppHost's
`/admin/migrate` HTTP command) since the database starts empty.

**Fix (durable):** Pin the SQL password to a stable value instead of
letting Aspire regenerate it on every deploy, so the volume and the
container env var never drift apart. In `AppHost.cs`:

```csharp
var sqlPassword = builder.AddParameter("sql-password", secret: true);

var sql = builder.AddSqlServer("sql", sqlPassword)
    .WithDataVolume();
```

Set the actual value once via `dotnet user-secrets set` (local) or the
deployment target's secret store (e.g. `aspire deploy` parameter prompt /
CI secret), so it stays the same across deploys. This avoids the
mismatch entirely — the volume and the generated `.env.Production` will
always agree. Clean up any leftover orphaned volumes from earlier,
differently-named compose projects (`docker volume ls`, `docker volume rm`)
to avoid confusion about which volume is actually in use.

**Status:** Root cause confirmed; fix not yet applied in this repo.

## Running EF Core migrations against the deployed Docker Compose stack

The `api` resource in `AppHost.cs` registers a custom resource command for
this purpose:

```csharp
var api = builder.AddProject<Projects.TourOfHeroes_Api>("api")
    .WithReference(heroesDb)
    .WaitFor(heroesDb)
    .WithExternalHttpEndpoints()
    .WithHttpCommand(
        path: "/admin/migrate",
        displayName: "Run Migrations",
        commandOptions: new HttpCommandOptions
        {
            Method = HttpMethod.Post,
            Description = "Applies pending EF Core migrations to the HeroesDb database."
        });
```

This maps to an endpoint in `TourOfHeroes.Api` (`/admin/migrate`) that calls
`DbContext.Database.MigrateAsync()` (or equivalent) against the connection
string Aspire injects (`ConnectionStrings__HeroesDb`, pointing at the `sql`
service). Prefer this over connecting to the `sql` container directly with
`sqlcmd`, since it reuses the app's own EF Core migration assembly and
connection configuration instead of requiring manual SQL.

### Option A — Trigger via the Aspire dashboard / orchestrator

If the Docker Compose stack is running under Aspire orchestration
(`aspire start`), the command is available as "Run Migrations" against the
`api` resource:

- Aspire dashboard: open the `api` resource and click **Run Migrations**.
- Aspire CLI / MCP: invoke the `execute_resource_command` tool (or
  equivalent `aspire` CLI command) against the `api` resource's
  `Run Migrations` command.

### Option B — Call the endpoint directly over HTTP

If the stack was started independently (e.g. a bare `docker compose up`
with no Aspire orchestrator attached), call the endpoint directly. The
`api` service publishes its container port to the host (see
`docker-compose.yaml`: `ports: - "${API_PORT}"`), so it's reachable from the
Docker host without going through the `gateway`:

```powershell
# API_PORT is resolved in TourOfHeroes.AppHost\aspire-output\.env.Production (default 8080)
curl -X POST http://localhost:8080/admin/migrate
```

Note: `/admin/migrate` is **not** proxied by the `gateway`'s YARP route
(only `/api/{**catch-all}` is), so it must be called against the `api`
service's own published port, not through the gateway's public URL.

### When to use this vs. the manual `sqlcmd` approach

Use `/admin/migrate` for applying the application's EF Core migrations
(the normal case). Only fall back to exec'ing into the `sql` container with
`sqlcmd` (see other issues in this log) when you need to run ad hoc T-SQL
that isn't part of an EF Core migration — e.g. inspecting data or manually
fixing up a login/password mismatch like Issue 4 above.
