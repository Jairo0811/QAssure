using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Projects;
using QAssure.Domain.Requirements;
using QAssure.Domain.Risks;
using QAssure.Domain.Testing;
using QAssure.Domain.Users;

namespace QAssure.Infrastructure.Persistence;

public sealed class QAssureDbContext(DbContextOptions<QAssureDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Requirement> Requirements => Set<Requirement>();
    public DbSet<RiskItem> Risks => Set<RiskItem>();
    public DbSet<TestCase> TestCases => Set<TestCase>();
    public DbSet<UserAccount> Users => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(builder =>
        {
            builder.ToTable("Projects");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Name).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Key).HasMaxLength(12).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(2000);
            builder.Property(x => x.Version).HasMaxLength(40).IsRequired();
            builder.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<Requirement>(builder =>
        {
            builder.ToTable("Requirements");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.AcceptanceCriteria).HasMaxLength(4000).IsRequired();
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>()
                .WithMany()
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiskItem>(builder =>
        {
            builder.ToTable("Risks");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Mitigation).HasMaxLength(4000).IsRequired();
            builder.Ignore(x => x.Score);
            builder.Ignore(x => x.Level);
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>()
                .WithMany()
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Requirement>()
                .WithMany()
                .HasForeignKey(x => x.RequirementId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TestCase>(builder =>
        {
            builder.ToTable("TestCases");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Objective).HasMaxLength(2000).IsRequired();
            builder.Property(x => x.Preconditions).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Steps).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.TestData).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ExpectedResult).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Postconditions).HasMaxLength(4000).IsRequired();
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>()
                .WithMany()
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Requirement>()
                .WithMany()
                .HasForeignKey(x => x.RequirementId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<RiskItem>()
                .WithMany()
                .HasForeignKey(x => x.RiskId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserAccount>(builder =>
        {
            builder.ToTable("Users");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Email).HasMaxLength(254).IsRequired();
            builder.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
            builder.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            builder.HasIndex(x => x.Email).IsUnique();
        });
    }
}
