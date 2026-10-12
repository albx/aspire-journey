# aspire-journey

Tour of Heroes sample app: an Angular frontend backed by an ASP.NET Core
(.NET 10) Web API using EF Core + SQL Server. See `docs/tour-of-heroes-plan.md`
for the full plan, `docs/backend.md` for the backend implementation log, and
`docs/frontend.md` for the frontend implementation log.

## Branches

The repo follows the journey step by step; each branch builds on the previous one.

| Branch | Description |
| --- | --- |
| `main` | Base Tour of Heroes app (Angular frontend + ASP.NET Core API, SQL Server in Docker). Same commit as `starting-point`. |
| `starting-point` | Starting point of the talk: the plain app, without Aspire. |
| `aspire-init` | Adds Aspire (AppHost) to orchestrate the API, frontend and SQL Server, with a custom command to initialize the database. |
| `aspire-frontend-gateway` (current) | Builds on `aspire-init`: adds a YARP gateway that acts as reverse proxy hosting both the API and the frontend static files. |
| `docker-compose-deployment` | Builds on `aspire-frontend-gateway`: adds the Docker Compose environment to deploy the app, plus a script to run migrations. |

## Repo layout

```
/frontend                      -> Angular app (standalone components, Angular Material)
/backend                       -> ASP.NET Core Web API (Minimal APIs, EF Core, Scalar docs)
/TourOfHeroes.AppHost          -> Aspire AppHost (SQL Server, API, frontend, YARP gateway)
/TourOfHeroes.ServiceDefaults  -> Shared Aspire defaults (OpenTelemetry, health checks, resilience)
```

On this branch the whole app is orchestrated with Aspire: the AppHost
starts and wires SQL Server, the API, the frontend and a YARP gateway.

The gateway is the single entry point of the app. It forwards
`/api/**` to the API and everything else to the frontend: the Vite dev
server when running locally, or the built frontend assets served
directly by the gateway when publishing. The frontend therefore calls
the API through a relative `/api` URL (during `ng serve` it is proxied
to the API via `frontend/proxy.conf.js`), so no hard-coded backend URL
is needed. The API connection string now comes from Aspire instead of
`appsettings.json`.

## Running with Aspire

1. Install the [Aspire CLI](https://aspire.dev), Docker, and Node.js
   24.19.0+.
2. From the repo root, start everything:
   ```
   aspire start
   ```
   This starts the AppHost in the background. Alternatively, use
   `aspire run` to run it in the foreground.

   The AppHost starts a SQL Server container (with a persistent data
   volume), the `HeroesDb` database, the API, the Angular frontend
   (Vite dev server) and the `gateway`, and wires connection strings
   and service URLs.
3. Open the Aspire dashboard (URL printed by the CLI) to see resources,
   logs and traces. Open the app through the `gateway` endpoint listed
   there.
4. Create the schema (see below).
5. Stop with `aspire stop` (if started with `aspire start`), or press
   `Ctrl+C` (if started with `aspire run`).

### Running migrations (custom command)

The `api` resource exposes a custom dashboard command, **Run Migrations**,
which sends `POST /admin/migrate` to the API and applies the pending EF
Core migrations to `HeroesDb` (creating the table and seeding sample
heroes). Run it once after the first start, and again whenever new
migrations are added:

1. Wait until `sql`, `HeroesDb` and `api` show as **Running** in the
   dashboard.
2. On the **Resources** page, open the actions menu (`...`) of the `api`
   row and select **Run Migrations**.
3. A notification reports success or failure; check the `api` console
   logs for details.

The SQL Server data lives in a persistent volume, so the schema survives
restarts and you only need to re-run the command if the volume is removed.

## Tests

- Backend: `dotnet test` (from `backend/`, once test projects exist).
- Frontend: `npx ng test --watch=false` (from `frontend/`).
