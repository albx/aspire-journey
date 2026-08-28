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

var frontend =builder.AddViteApp("frontend", "../frontend")
    .WithRunScript("start")
    .WithReference(api)
    .WaitFor(api)
    .WithExternalHttpEndpoints();

var gateway = builder.AddYarp("gateway")
    .WithExternalHttpEndpoints()
    .WithConfiguration(yarp =>
    {
        yarp.AddRoute("/api/{**catch-all}", api);

        // Locally, proxy everything else to the Vite dev server; in production the
        // gateway serves the built frontend assets directly (PublishWithStaticFiles).
        if (builder.ExecutionContext.IsRunMode)
        {
            yarp.AddRoute(frontend);
        }
    })
    .PublishWithStaticFiles(frontend)
    .WaitFor(api);

if (builder.ExecutionContext.IsRunMode)
{
    gateway.WaitFor(frontend);
}

builder.Build().Run();
