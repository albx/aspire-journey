using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TourOfHeroes.Api.Data;
using TourOfHeroes.Api.Models;

namespace TourOfHeroes.Api.Endpoints;

public static class HeroesEndpoints
{
    public static IEndpointRouteBuilder MapHeroesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/heroes").WithTags("Heroes");

        group.MapGet("/", GetHeroes)
            .WithName(nameof(GetHeroes));

        group.MapGet("/{id:int}", GetHeroById)
            .WithName(nameof(GetHeroById));

        group.MapPost("/", CreateHero)
            .WithName(nameof(CreateHero));
        
        group.MapPut("/{id:int}", UpdateHero)
            .WithName(nameof(UpdateHero));
        
        group.MapDelete("/{id:int}", DeleteHero)
            .WithName(nameof(DeleteHero));

        return app;
    }

    private static async Task<Ok<List<HeroDto>>> GetHeroes(HeroesDbContext db, string? name)
    {
        var query = db.Heroes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            query = query.Where(h => h.Name.Contains(name));
        }

        var heroes = await query
            .OrderBy(h => h.Id)
            .Select(h => new HeroDto(h.Id, h.Name))
            .ToListAsync();

        return TypedResults.Ok(heroes);
    }

    private static async Task<Results<Ok<HeroDto>, NotFound>> GetHeroById(HeroesDbContext db, int id)
    {
        var hero = await db.Heroes.FindAsync(id);

        return hero is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(new HeroDto(hero.Id, hero.Name));
    }

    private static async Task<CreatedAtRoute<HeroDto>> CreateHero(HeroesDbContext db, CreateHeroRequest request)
    {
        var hero = new Hero { Name = request.Name };

        db.Heroes.Add(hero);
        await db.SaveChangesAsync();

        var dto = new HeroDto(hero.Id, hero.Name);
        return TypedResults.CreatedAtRoute(dto, nameof(GetHeroById), new { id = hero.Id });
    }

    private static async Task<Results<Ok<HeroDto>, NotFound>> UpdateHero(HeroesDbContext db, int id, UpdateHeroRequest request)
    {
        var hero = await db.Heroes.FindAsync(id);

        if (hero is null)
        {
            return TypedResults.NotFound();
        }

        hero.Name = request.Name;
        await db.SaveChangesAsync();

        return TypedResults.Ok(new HeroDto(hero.Id, hero.Name));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteHero(HeroesDbContext db, int id)
    {
        var hero = await db.Heroes.FindAsync(id);

        if (hero is null)
        {
            return TypedResults.NotFound();
        }

        db.Heroes.Remove(hero);
        await db.SaveChangesAsync();

        return TypedResults.NoContent();
    }
}
