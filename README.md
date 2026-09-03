# aspire-journey

Tour of Heroes sample app: an Angular frontend backed by an ASP.NET Core
(.NET 10) Web API using EF Core + SQL Server. See `docs/tour-of-heroes-plan.md`
for the full plan, `docs/backend.md` for the backend implementation log, and
`docs/frontend.md` for the frontend implementation log.

## Repo layout

```
/frontend   -> Angular app (standalone components, Angular Material)
/backend    -> ASP.NET Core Web API (Minimal APIs, EF Core, Scalar docs)
```

## Running the backend

1. Start a local SQL Server container (requires Docker):
   ```
   ./scripts/start-sql-server.ps1
   ```
   This runs `mcr.microsoft.com/mssql/server:2022-latest` in a container
   named `tour-of-heroes-sql`, exposed on `localhost,1433` with a fixed
   local-dev SA password, and stores its data in a named Docker volume
   (`tour-of-heroes-sql-data`) so the database survives stopping and
   recreating the container. It prints the connection string to use —
   this already matches the default in `appsettings.json`, so no further
   changes are needed for local development. Wait ~10-20 seconds after
   starting for SQL Server to be ready to accept connections.
2. Apply the EF Core migration (creates the database/table and seeds
   sample heroes):
   ```
   cd backend/TourOfHeroes.Api
   dotnet ef database update
   ```
3. Run the API:
   ```
   dotnet run
   ```
   By default it listens on `http://localhost:5047` (see
   `Properties/launchSettings.json`). Interactive API docs are available
   at `/scalar` once running.
4. When you're done, stop and remove the SQL Server container:
   ```
   ./scripts/stop-sql-server.ps1
   ```
   By default this keeps the `tour-of-heroes-sql-data` volume, so your
   data survives and the next `start-sql-server.ps1` reuses it (no need
   to re-run `dotnet ef database update`). Pass `-RemoveVolume` to also
   permanently delete the data:
   ```
   ./scripts/stop-sql-server.ps1 -RemoveVolume
   ```

## Running the frontend

1. Make sure Node.js 24.19.0+ is active (this project was built/tested
   with `nvm use 24.19.0`).
2. Install dependencies (first time only):
   ```
   cd frontend
   npm install
   ```
3. Confirm `src/environments/environment.development.ts` points
   `apiBaseUrl` at your running backend (defaults to
   `http://localhost:5047/api`).
4. Start the dev server:
   ```
   npx ng serve
   ```
   The app runs at `http://localhost:4200` and expects the backend to be
   running and reachable (CORS is already configured backend-side for
   this origin).

## Docker Compose deployment demo

The `TourOfHeroes.AppHost` project can deploy the whole app (SQL Server, API,
Angular frontend, YARP gateway) to Docker Compose. A typical demo flow:

1. Tear down any previous deployment:
   ```
   cd TourOfHeroes.AppHost
   aspire destroy --yes
   ```
2. Generate the Docker Compose artifacts (no build, just shows the
   generated `aspire-output/docker-compose.yaml`):
   ```
   aspire publish
   ```
3. Build the images and bring the stack up:
   ```
   aspire deploy
   ```
   Note the `api` URL printed at the end of the command (e.g.
   `api: http://localhost:56538`) — SQL Server needs a schema before the
   API can serve requests.
4. In a separate terminal, apply EF Core migrations to the freshly
   deployed database:
   ```
   cd ..
   ./scripts/run-migrations.ps1
   ```
   This auto-discovers the running `api` container's published port and
   POSTs to its `/admin/migrate` endpoint, retrying a few times in case
   SQL Server is still starting up. Pass `-ApiUrl http://localhost:PORT`
   to target a specific port instead of auto-discovery.

   Kept as a separate script on purpose, so `aspire publish`/`aspire deploy`
   stay the focus of the demo.

See `docs/deployment-troubleshooting.md` for issues encountered (and fixed)
while getting this deployment working, including why migrations aren't
applied automatically today.

## Tests

- Backend: `dotnet test` (from `backend/`, once test projects exist).
- Frontend: `npx ng test --watch=false` (from `frontend/`).
