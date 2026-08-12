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

1. Add your own SQL Server connection string under
   `ConnectionStrings:HeroesDb` in
   `backend/TourOfHeroes.Api/appsettings.json` (or
   `appsettings.Development.json` / user-secrets).
2. Apply the EF Core migration:
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

## Tests

- Backend: `dotnet test` (from `backend/`, once test projects exist).
- Frontend: `npx ng test --watch=false` (from `frontend/`).
