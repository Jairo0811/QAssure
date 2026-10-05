using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Projects;
using QAssure.Domain.Testing;

namespace QAssure.Infrastructure.Persistence;

public sealed class QAssureDbContext(DbContextOptions<QAssureDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TestCase> TestCases => Set<TestCase>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(builder =>
        {
            builder.ToTable("Projects");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Name).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Key).HasMaxLength(12).IsRequired();
            builder.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<TestCase>(builder =>
        {
            builder.ToTable("TestCases");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
        });
    }
}
