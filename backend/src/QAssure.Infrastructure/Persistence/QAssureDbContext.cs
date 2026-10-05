using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Defects;
using QAssure.Domain.Projects;
using QAssure.Domain.Quality;
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
    public DbSet<TestRun> TestRuns => Set<TestRun>();
    public DbSet<TestExecution> TestExecutions => Set<TestExecution>();
    public DbSet<Defect> Defects => Set<Defect>();
    public DbSet<ValidationEvidence> ValidationEvidences => Set<ValidationEvidence>();
    public DbSet<UserAccount> Users => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(builder =>
        {
            builder.ToTable("Projects"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Name).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Key).HasMaxLength(12).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(2000);
            builder.Property(x => x.Version).HasMaxLength(40).IsRequired();
            builder.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<Requirement>(builder =>
        {
            builder.ToTable("Requirements"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.AcceptanceCriteria).HasMaxLength(4000).IsRequired();
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiskItem>(builder =>
        {
            builder.ToTable("Risks"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Mitigation).HasMaxLength(4000).IsRequired();
            builder.Ignore(x => x.Score); builder.Ignore(x => x.Level);
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Requirement>().WithMany().HasForeignKey(x => x.RequirementId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TestCase>(builder =>
        {
            builder.ToTable("TestCases"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Objective).HasMaxLength(2000).IsRequired();
            builder.Property(x => x.Preconditions).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Steps).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.TestData).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ExpectedResult).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.Postconditions).HasMaxLength(4000).IsRequired();
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Requirement>().WithMany().HasForeignKey(x => x.RequirementId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<RiskItem>().WithMany().HasForeignKey(x => x.RiskId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TestRun>(builder =>
        {
            builder.ToTable("TestRuns"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Name).HasMaxLength(180).IsRequired();
            builder.Property(x => x.BuildVersion).HasMaxLength(80).IsRequired();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(x => new { x.ProjectId, x.CreatedAtUtc });
        });

        modelBuilder.Entity<TestExecution>(builder =>
        {
            builder.ToTable("TestExecutions"); builder.HasKey(x => x.Id);
            builder.Property(x => x.ActualResult).HasMaxLength(4000);
            builder.Property(x => x.Notes).HasMaxLength(4000);
            builder.Property(x => x.Evidence).HasMaxLength(1000);
            builder.Property(x => x.ExecutedBy).HasMaxLength(120);
            builder.HasIndex(x => new { x.TestRunId, x.TestCaseId }).IsUnique();
            builder.HasOne<TestRun>().WithMany().HasForeignKey(x => x.TestRunId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<TestCase>().WithMany().HasForeignKey(x => x.TestCaseId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Defect>(builder =>
        {
            builder.ToTable("Defects"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ReproductionSteps).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ExpectedResult).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ActualResult).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.AssignedTo).HasMaxLength(120);
            builder.Property(x => x.Resolution).HasMaxLength(4000);
            builder.HasIndex(x => new { x.ProjectId, x.Code }).IsUnique();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<TestExecution>().WithMany().HasForeignKey(x => x.ExecutionId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<TestCase>().WithMany().HasForeignKey(x => x.TestCaseId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<TestExecution>().WithMany().HasForeignKey(x => x.RetestExecutionId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ValidationEvidence>(builder =>
        {
            builder.ToTable("ValidationEvidences"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
            builder.Property(x => x.Evidence).HasMaxLength(4000).IsRequired();
            builder.Property(x => x.ExecutedBy).HasMaxLength(120).IsRequired();
            builder.HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(x => new { x.ProjectId, x.Category, x.ExecutedAtUtc });
        });

        modelBuilder.Entity<UserAccount>(builder =>
        {
            builder.ToTable("Users"); builder.HasKey(x => x.Id);
            builder.Property(x => x.Email).HasMaxLength(254).IsRequired();
            builder.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
            builder.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            builder.HasIndex(x => x.Email).IsUnique();
        });
    }
}
