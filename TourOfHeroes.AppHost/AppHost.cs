var builder = DistributedApplication.CreateBuilder(args);

var sql = builder.AddSqlServer("sql")
    .WithDataVolume();

var heroesDb = sql.AddDatabase("HeroesDb");

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

builder.AddViteApp("frontend", "../frontend")
    .WithRunScript("start")
    .WithReference(api)
    .WaitFor(api)
    .WithExternalHttpEndpoints();

builder.Build().Run();
