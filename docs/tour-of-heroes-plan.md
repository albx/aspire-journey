# Tour of Heroes — Angular + ASP.NET Core (.NET 10) Sample

## Problem / Goal
Recreate the classic Angular "Tour of Heroes" tutorial app, but replace the
in-memory Angular mock backend with a real ASP.NET Core (.NET 10) Web API
backed by SQL Server via EF Core. This is a plain two-project sample (no
.NET Aspire yet — Aspire orchestration will be layered in later for a talk).

Repo layout:
```
/frontend   -> Angular app
/backend    -> ASP.NET Core Web API
```

## Confirmed decisions (from clarifying questions)
- No .NET Aspire for now (plain solution); Aspire added later separately.
- Backend: ASP.NET Core Minimal APIs (.NET 10).
- Data: EF Core + SQL Server. User will supply their own connection string
  in `backend` config (appsettings / user-secrets) — plan should leave a
  placeholder connection string and use EF Core migrations.
- Frontend: Angular latest, standalone components (no NgModules).
- UI: Angular Material.
- Feature scope: full original tutorial — Dashboard (top heroes), Heroes
  list (CRUD), Hero detail/edit, live search, Messages log service.
- API docs: OpenAPI (no Swagger UI) + Scalar UI for interactive docs.
- Node: use nvm, switch to already-installed Node 22.14.0 for the Angular
  tooling (`nvm use 22.14.0`).

## Backend plan (`/backend`)
1. Scaffold `dotnet new webapi` (empty/minimal template) targeting .NET 10,
   named e.g. `TourOfHeroes.Api`, placed under `backend/`.
2. Add NuGet packages: `Microsoft.EntityFrameworkCore.SqlServer`,
   `Microsoft.EntityFrameworkCore.Design`, `Scalar.AspNetCore`.
3. Define `Hero` entity (Id, Name) matching the original tutorial's model.
4. Add `HeroesDbContext` (DbSet<Hero>) with a placeholder connection string
   in `appsettings.json` (`"HeroesDb": "<ADD-YOUR-CONNECTION-STRING>"`) —
   user will fill in their real one.
5. Add an EF Core migration + seed data (same sample heroes as the Angular
   tutorial: Mr. Nice, Narco, Bombasto, Celeritas, Magneta, RubberMan,
   Dynama, Dr IQ, Magma, Tornado).
6. Implement Minimal API endpoints under `/api/heroes`:
   - `GET /api/heroes` — list all
   - `GET /api/heroes/{id}` — get one
   - `GET /api/heroes/search?name=` — search by name substring
   - `POST /api/heroes` — create
   - `PUT /api/heroes/{id}` — update
   - `DELETE /api/heroes/{id}` — delete
7. Register CORS policy allowing the Angular dev server origin
   (`http://localhost:4200`).
8. Add OpenAPI generation (`AddOpenApi`/`MapOpenApi`) and wire up
   `Scalar.AspNetCore` (`MapScalarApiReference`) for interactive docs
   (e.g. at `/scalar`), skipping Swagger UI entirely.
9. Verify: `dotnet build`, `dotnet ef database update` (once user adds
   connection string), run API and hit `/scalar` + a couple of endpoints.

## Frontend plan (`/frontend`)
1. Ensure Node 22.14.0 active via `nvm use 22.14.0`.
2. Scaffold with latest Angular CLI: `ng new frontend --standalone --style=css --routing`
   (placed so the project lives at `frontend/`).
3. Add Angular Material: `ng add @angular/material`.
4. Recreate tutorial structure with standalone components:
   - `Hero` model/interface matching backend DTO (id, name).
   - `HeroService` — HttpClient calls to the backend API (CRUD + search),
     replacing the tutorial's `HeroService` + `InMemoryDataService`.
   - `MessageService` — same as original, logs app messages, displayed by
     a `MessagesComponent`.
   - `DashboardComponent` — shows top N heroes, links to detail.
   - `HeroesComponent` — full list with delete, add-new, links to detail.
   - `HeroDetailComponent` — view/edit a hero, save via service.
   - `HeroSearchComponent` — live search-as-you-type using RxJS
     (debounceTime/distinctUntilChanged/switchMap) against
     `GET /api/heroes/search`.
   - App routing: `/dashboard` (default), `/heroes`, `/detail/:id`.
5. Configure `environment.ts` / `environment.development.ts` with backend
   API base URL (e.g. `http://localhost:5xxx/api`).
6. Style pass using Angular Material components (toolbar, list, cards,
   form fields) replacing the tutorial's plain CSS, keeping the same
   overall visual layout/spirit.
7. Verify: `ng build`, `ng serve`, manually confirm dashboard/list/detail/
   search all work end-to-end against the running backend.

## Cross-cutting / integration
- Confirm CORS between the two dev servers works end-to-end.
- Add a top-level `README.md` update describing how to run both projects
  (backend connection string setup, `dotnet run`, `nvm use 22.14.0`,
  `ng serve`).
- Keep `.gitignore` as-is (already covers VS/.NET); add Angular/Node
  ignores (`frontend/node_modules`, `frontend/dist`, etc.) — check if
  `ng new` generates its own `.gitignore` inside `frontend/` and rely on
  that instead of duplicating in the root.

## Notes / considerations
- Connection string is intentionally left as a placeholder; the user
  will supply their own SQL Server connection and run the EF Core
  migration themselves if preferred.
- Aspire orchestration (AppHost, service defaults) is explicitly out of
  scope for this pass — structure will be added in a future session.
- Scalar is used instead of Swagger UI per user preference.
