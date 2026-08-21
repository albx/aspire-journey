var builder = DistributedApplication.CreateBuilder(args);

var sql = builder.AddSqlServer("sql")
    .WithDataVolume();

var heroesDb = sql.AddDatabase("HeroesDb");

var api = builder.AddProject<Projects.TourOfHeroes_Api>("api")
    .WithReference(heroesDb)
    .WaitFor(heroesDb)
    .WithExternalHttpEndpoints();

builder.AddViteApp("frontend", "../frontend")
    .WithRunScript("start")
    .WithReference(api)
    .WaitFor(api)
    .WithExternalHttpEndpoints();

builder.Build().Run();
