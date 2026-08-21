using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TourOfHeroes.Api.Data;
using TourOfHeroes.Api.Endpoints;

const string AngularDevClientPolicy = "AngularDevClient";

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.AddSqlServerDbContext<HeroesDbContext>("HeroesDb");

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseCors(AngularDevClientPolicy);

app.MapHeroesEndpoints();

app.Run();
