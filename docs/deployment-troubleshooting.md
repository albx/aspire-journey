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

## Issue 4 — API returns 500 with "Login failed for user 'sa'" (open)

**Symptom:** After Issues 1–3 were fixed, the gateway correctly serves the
frontend and proxies `/api/**` to the `api` service, but API calls return
`500` with a SQL login failure for `sa`.

**Likely cause:** The `sql` resource uses `WithDataVolume()`, so its data
directory (`/var/opt/mssql`) persists across deploys in a Docker volume.
SQL Server only applies `MSSQL_SA_PASSWORD` the *first* time it initializes
that volume. Each `aspire deploy` run generates a new random `SQL_PASSWORD`
parameter, so once the volume already has data, the container's new
password no longer matches the password baked into the existing SQL Server
instance — causing `Error Number: 18456` (login failed).

**Status:** Not yet fixed. Options to resolve:
- Remove/reset the stale SQL data volume so SQL Server re-initializes with
  the current `SQL_PASSWORD` (destructive — deletes existing data).
- Pin the SQL password parameter to a stable value across deploys instead
  of letting Aspire regenerate it each time.
