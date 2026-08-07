using Microsoft.EntityFrameworkCore;

namespace TourOfHeroes.Api.Data;

public class HeroesDbContext(DbContextOptions<HeroesDbContext> options) : DbContext(options)
{
    public DbSet<Hero> Heroes => Set<Hero>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Hero>(entity =>
        {
            entity.Property(h => h.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasData(
                new Hero { Id = 11, Name = "Iron Man" },
                new Hero { Id = 12, Name = "Spider-Man" },
                new Hero { Id = 13, Name = "Captain America" },
                new Hero { Id = 14, Name = "Thor" },
                new Hero { Id = 15, Name = "Black Widow" },
                new Hero { Id = 16, Name = "Hulk" },
                new Hero { Id = 17, Name = "Black Panther" },
                new Hero { Id = 18, Name = "Doctor Strange" },
                new Hero { Id = 19, Name = "Scarlet Witch" },
                new Hero { Id = 20, Name = "Wolverine" });
        });
    }
}
