# Backend Implementation Log

This document tracks each implementation step of the ASP.NET Core (.NET 10)
backend for the Tour of Heroes sample, in the order it was carried out. See
`docs/tour-of-heroes-plan.md` for the overall plan.

## Step 1 — Scaffold the ASP.NET Core backend project

**Goal:** create the Minimal API project under `backend/` targeting .NET 10.

**What was done:**
1. Created the `backend/` folder and scaffolded a Minimal API project with:
   ```
   dotnet new webapi -n TourOfHeroes.Api -minimal -f net10.0 -o backend\TourOfHeroes.Api
   ```
2. The generated project referenced `Microsoft.AspNetCore.OpenApi 10.0.10`,
   which pulls in a transitive `Microsoft.OpenApi 2.0.0` package flagged with
   a known high-severity vulnerability (`NU1903`,
   [GHSA-v5pm-xwqc-g5wc](https://github.com/advisories/GHSA-v5pm-xwqc-g5wc)).
   - Attempted to pin `Microsoft.OpenApi` to the latest `3.9.0` (both by
     editing the `.csproj` directly and via `dotnet add package
     Microsoft.OpenApi`), but this broke the build: the source generator
     shipped with `Microsoft.AspNetCore.OpenApi 10.0.10` is not compatible
     with the breaking API changes in `Microsoft.OpenApi 3.x`
     (`CS0200: Non è possibile assegnare un valore alla proprietà
     'IOpenApiMediaType.Example' perché è di sola lettura`).
   - Per user decision, removed the explicit `Microsoft.OpenApi` package
     reference and kept the default transitive `2.0.0` version pulled in by
     `Microsoft.AspNetCore.OpenApi`. The `NU1903` warning is accepted for now
     and should be revisited once Microsoft ships an `Microsoft.AspNetCore.OpenApi`
     version compatible with `Microsoft.OpenApi 3.x`.
3. Removed the template's sample `WeatherForecast` endpoint/record from
   `Program.cs` and deleted the generated `TourOfHeroes.Api.http` sample
   file, since they aren't part of this project.
4. Created a root-level solution file in the new **`.slnx`** format (per
   user preference) named `TourOfHeroes.slnx`, with the backend project
   placed inside a `backend` solution folder:
   ```
   dotnet new sln -n TourOfHeroes
   dotnet sln TourOfHeroes.slnx add backend\TourOfHeroes.Api\TourOfHeroes.Api.csproj --solution-folder backend
   ```
5. Verified the project and solution both build cleanly (`dotnet build`,
   `dotnet build TourOfHeroes.slnx`) and that the API starts correctly with
   `dotnet run` (confirmed "Now listening on: http://localhost:5299" then
   stopped the process).

**Result:**
```
/TourOfHeroes.slnx                              -> root solution (slnx format)
/backend/TourOfHeroes.Api/TourOfHeroes.Api.csproj -> Minimal API project (.NET 10)
/backend/TourOfHeroes.Api/Program.cs              -> minimal, OpenAPI wired up, no sample endpoints
```

**Known follow-up:** the `NU1903` NuGet audit warning for the transitive
`Microsoft.OpenApi 2.0.0` package remains and was consciously accepted; no
direct package reference override is currently possible without breaking the
build against the current `Microsoft.AspNetCore.OpenApi 10.0.10` release.

**Status:** ✅ Done — awaiting review before proceeding to the next step
(adding EF Core / SQL Server packages).

## Step 2 — Add EF Core (SQL Server) and Scalar packages

**Goal:** add the NuGet packages needed for EF Core with SQL Server and for
Scalar-based interactive API documentation.

**What was done:**
1. Added the following packages via `dotnet add package`:
   - `Microsoft.EntityFrameworkCore.SqlServer` (10.0.10)
   - `Microsoft.EntityFrameworkCore.Tools` (10.0.10) — per user preference,
     used instead of a direct `Microsoft.EntityFrameworkCore.Design`
     reference, since `Design` is already a transitive dependency of
     `Tools`. `Tools` also enables running EF Core migration commands from
     the Visual Studio Package Manager Console (`Add-Migration`,
     `Update-Database`), not just the `dotnet ef` CLI.
   - `Scalar.AspNetCore` (2.16.18) — for interactive OpenAPI documentation
     (replacing Swagger UI, per earlier decision).
2. Verified the `dotnet-ef` CLI tool is already available globally
   (`dotnet ef --version` → `10.0.8`), so migrations can also be run from
   the command line in addition to Visual Studio's Package Manager Console.
3. Rebuilt the project (`dotnet build`) — succeeds with 0 errors; only the
   previously-accepted `NU1903` warning (transitive `Microsoft.OpenApi
   2.0.0`) remains, unchanged from Step 1.

**Result — updated `TourOfHeroes.Api.csproj`:**
```xml
<ItemGroup>
  <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.10" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.10" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.10">
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    <PrivateAssets>all</PrivateAssets>
  </PackageReference>
  <PackageReference Include="Scalar.AspNetCore" Version="2.16.18" />
</ItemGroup>
```

**Status:** ✅ Done — awaiting review before proceeding to the next step
(defining the `Hero` entity and `HeroesDbContext`).

## Step 3 — Define `Hero` entity and `HeroesDbContext`

**Goal:** create the domain model and EF Core `DbContext`, and wire up SQL
Server with a placeholder connection string for the user to fill in.

**What was done:**
1. Created `Models/Hero.cs` — a simple entity matching the original Angular
   tutorial's model:
   ```csharp
   public class Hero
   {
       public int Id { get; set; }
       public required string Name { get; set; }
   }
   ```
2. Created `Data/HeroesDbContext.cs` with a `DbSet<Hero> Heroes`, configuring
   `Name` as required with a max length of 100 via `OnModelCreating`.
3. Added a placeholder connection string to `appsettings.json` under
   `ConnectionStrings:HeroesDb`:
   ```json
   "ConnectionStrings": {
     "HeroesDb": "<ADD-YOUR-SQL-SERVER-CONNECTION-STRING-HERE>"
   }
   ```
   The user will replace this with their own SQL Server connection string
   (e.g. via `appsettings.Development.json` or user-secrets).
4. Registered `HeroesDbContext` in `Program.cs` with
   `AddDbContext<HeroesDbContext>` using `UseSqlServer(...)`, reading the
   connection string from configuration.
5. Verified the project builds successfully (`dotnet build`, 0 errors).

**Result — new files:**
```
backend/TourOfHeroes.Api/Models/Hero.cs
backend/TourOfHeroes.Api/Data/HeroesDbContext.cs
```

**Result — updated files:**
- `Program.cs` — registers `HeroesDbContext` with SQL Server provider.
- `appsettings.json` — placeholder `ConnectionStrings:HeroesDb` entry added.

**Status:** ✅ Done — awaiting review before proceeding to the next step
(adding the EF Core migration and seed data).

## Step 4 — Add EF Core migration with seed data

**Goal:** seed the same 10 sample heroes as the original Angular tutorial
and generate the initial EF Core migration.

**What was done:**
1. Added seed data via `HasData` in `HeroesDbContext.OnModelCreating`,
   using the same 10 heroes (and the same IDs, 11–20) as the original
   Angular Tour of Heroes tutorial's `InMemoryDataService`:
   Mr. Nice, Narco, Bombasto, Celeritas, Magneta, RubberMan, Dynama,
   Dr IQ, Magma, Tornado.
2. Verified the project still builds (`dotnet build`, 0 errors).
3. Generated the initial migration:
   ```
   dotnet ef migrations add InitialCreate
   ```
   This created `Migrations/20260807151946_InitialCreate.cs` (plus the
   designer file and updated `HeroesDbContextModelSnapshot.cs`), which
   creates the `Heroes` table and inserts the 10 seed rows.
4. Noticed the `dotnet-ef` global CLI tool (10.0.8) was older than the
   project's EF Core runtime (10.0.10); updated it with
   `dotnet tool update --global dotnet-ef` to keep versions aligned and
   avoid tooling/runtime mismatches for future migrations.

**Result — new files:**
```
backend/TourOfHeroes.Api/Migrations/20260807151946_InitialCreate.cs
backend/TourOfHeroes.Api/Migrations/20260807151946_InitialCreate.Designer.cs
backend/TourOfHeroes.Api/Migrations/HeroesDbContextModelSnapshot.cs
```

**Note:** The migration has **not** been applied to any database yet
(`dotnet ef database update` was not run) since the real SQL Server
connection string still needs to be supplied by the user in
`appsettings.json` (or `appsettings.Development.json` / user-secrets).
Once that's in place, run:
```
dotnet ef database update
```
from `backend/TourOfHeroes.Api` to create the database and seed the data.

**Update:** per user request, the seed data was changed from the original
Angular tutorial's fictional heroes to Marvel superheroes: Iron Man,
Spider-Man, Captain America, Thor, Black Widow, Hulk, Black Panther,
Doctor Strange, Scarlet Witch, Wolverine (same IDs 11–20). Since the
migration had not been applied to any database yet, it was safely
regenerated from scratch:
```
dotnet ef migrations remove --force   # --force needed: placeholder connection string prevents DB check
dotnet ef migrations add InitialCreate
```
This produced a fresh `InitialCreate` migration (new timestamp) containing
the updated seed rows. Build verified clean afterwards.

**Status:** ✅ Done — awaiting review before proceeding to the next step
(implementing the Minimal API endpoints for `/api/heroes`).

## Step 5 — Implement Minimal API endpoints for `/api/heroes`

**Goal:** expose CRUD + search over the `Hero` entity via Minimal API
endpoints.

**What was done:**
1. Reorganized files per user feedback, separating concerns:
   - Moved the `Hero` entity from `Models/Hero.cs` into `Data/Hero.cs`
     (namespace `TourOfHeroes.Api.Data`), alongside `HeroesDbContext`,
     since it's part of the persistence model.
   - Split the API request/response DTOs into their own files under
     `Models/` (namespace `TourOfHeroes.Api.Models`):
     - `Models/HeroDto.cs` — `record HeroDto(int Id, string Name)`
     - `Models/CreateHeroRequest.cs` — `record CreateHeroRequest(string Name)`
     - `Models/UpdateHeroRequest.cs` — `record UpdateHeroRequest(string Name)`
2. Created `Endpoints/HeroesEndpoints.cs` with a `MapHeroesEndpoints`
   extension method, grouping all routes under `/api/heroes`
   (`MapGroup("/api/heroes").WithTags("Heroes")`), using typed results
   (`TypedResults`) for each handler:
   - `GET /api/heroes` and `GET /api/heroes?name=...` — list all heroes,
     with an **optional** `name` query-string parameter that filters by a
     case-insensitive substring match (`EF.Functions.Like`). Per user
     feedback, this replaced a separate `/search` endpoint — the original
     tutorial's dedicated search endpoint is now just an optional filter
     on the list endpoint.
   - `GET /api/heroes/{id}` — get one hero by id (404 if not found).
   - `POST /api/heroes` — create a hero from `CreateHeroRequest`, returns
     `201 Created` with a `Location` header and the created `HeroDto`.
   - `PUT /api/heroes/{id}` — update a hero's name from
     `UpdateHeroRequest` (404 if not found).
   - `DELETE /api/heroes/{id}` — delete a hero (`204 No Content`, or 404
     if not found).
3. Wired `app.MapHeroesEndpoints()` into `Program.cs`.
4. Verified the project builds successfully (`dotnet build`, 0 errors).

**Result — new/updated files:**
```
backend/TourOfHeroes.Api/Data/Hero.cs                  (moved from Models/)
backend/TourOfHeroes.Api/Models/HeroDto.cs
backend/TourOfHeroes.Api/Models/CreateHeroRequest.cs
backend/TourOfHeroes.Api/Models/UpdateHeroRequest.cs
backend/TourOfHeroes.Api/Endpoints/HeroesEndpoints.cs
backend/TourOfHeroes.Api/Program.cs                    (registers endpoints)
```

**Status:** ✅ Done — awaiting review before proceeding to the next step
(configuring CORS and OpenAPI + Scalar docs).

## Step 6 — Configure CORS and OpenAPI + Scalar docs

**Goal:** allow the Angular dev server to call the API, and expose
interactive API documentation via Scalar (no Swagger UI).

**What was done:**
1. Registered a CORS policy named `AngularDevClient` in `Program.cs`,
   allowing origin `http://localhost:4200` (the default Angular CLI dev
   server address) with any header/method, and applied it with
   `app.UseCors(AngularDevClientPolicy)` before endpoint mapping.
2. Added `app.MapScalarApiReference()` (from the `Scalar.AspNetCore`
   package added in Step 2) alongside the existing `app.MapOpenApi()`
   call, both scoped to the Development environment. This serves:
   - the raw OpenAPI document at `/openapi/v1.json`
   - an interactive Scalar UI at `/scalar`
3. Verified by running the API (`dotnet run`) — it starts successfully
   without a real database connection (EF Core connects lazily, only on
   first query), and:
   - `GET http://localhost:5299/scalar` → `200 OK`
   - `GET http://localhost:5299/openapi/v1.json` → `200 OK`
4. Rebuilt (`dotnet build`) — 0 errors.

**Result — updated `Program.cs`:**
```csharp
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TourOfHeroes.Api.Data;
using TourOfHeroes.Api.Endpoints;

const string AngularDevClientPolicy = "AngularDevClient";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<HeroesDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("HeroesDb")));

builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularDevClientPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors(AngularDevClientPolicy);
app.MapHeroesEndpoints();

app.Run();
```

**Status:** ✅ Done — awaiting review before proceeding to the next step
(final backend verification: build, migrations, and manual endpoint
checks).

## Step 7 — Final backend verification

**Goal:** confirm the whole backend builds and runs correctly end-to-end
before moving on to the frontend.

**What was done:**
1. Built the full solution: `dotnet build TourOfHeroes.slnx` → 0 errors
   (only the previously-accepted `NU1903` warning remains).
2. Ran the API (`dotnet run`) and exercised it manually:
   - `GET /api/heroes` → `500 Internal Server Error`, as **expected**:
     the connection string is still the placeholder
     (`<ADD-YOUR-SQL-SERVER-CONNECTION-STRING-HERE>`) in
     `appsettings.json`; EF Core only connects lazily on first query, so
     the app starts fine but data endpoints fail until a real SQL Server
     connection string is supplied.
   - `GET /scalar` → `200 OK` (interactive API docs load correctly).
   - `GET /openapi/v1.json` → `200 OK`; inspected the generated document
     and confirmed both route groups are present: `/api/heroes` (list +
     create) and `/api/heroes/{id}` (get/update/delete).
3. Did **not** run `dotnet ef database update`, since that requires a
   real SQL Server connection string, which the user will supply
   themselves (as agreed in Step 3).

**Outstanding action for the user (not part of this automated pass):**
1. Replace the placeholder in `appsettings.json` (or
   `appsettings.Development.json` / user secrets) with a real SQL Server
   connection string under `ConnectionStrings:HeroesDb`.
2. From `backend/TourOfHeroes.Api`, run:
   ```
   dotnet ef database update
   ```
   to create the database, apply the `InitialCreate` migration, and seed
   the 10 Marvel heroes.
3. Re-run `dotnet run` and confirm `GET http://localhost:<port>/api/heroes`
   now returns the seeded hero list instead of a 500 error.

**Backend implementation is otherwise complete.** Final project layout:
```
/TourOfHeroes.slnx
/backend/TourOfHeroes.Api/
  Data/
    Hero.cs
    HeroesDbContext.cs
  Endpoints/
    HeroesEndpoints.cs
  Migrations/
    20260807152204_InitialCreate.cs
    20260807152204_InitialCreate.Designer.cs
    HeroesDbContextModelSnapshot.cs
  Models/
    HeroDto.cs
    CreateHeroRequest.cs
    UpdateHeroRequest.cs
  Program.cs
  appsettings.json            (placeholder connection string)
  appsettings.Development.json
  TourOfHeroes.Api.csproj
```

**Status:** ✅ Done — backend implementation complete, pending the user's
own SQL Server connection string and `dotnet ef database update`. Ready to
move on to the frontend (Angular) implementation.
