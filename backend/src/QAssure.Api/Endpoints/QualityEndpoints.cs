using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Defects;
using QAssure.Domain.Quality;
using QAssure.Domain.Risks;
using QAssure.Domain.Testing;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class QualityEndpoints
{
    public static IEndpointRouteBuilder MapQualityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/quality").WithTags("Quality").RequireAuthorization();

        group.MapGet("/report", async (Guid projectId, QAssureDbContext db, CancellationToken ct) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, ct)) return Results.NotFound(new { message = "Project not found." });
            return Results.Ok(await BuildReport(projectId, db, ct));
        });

        group.MapGet("/validation", async (Guid projectId, QAssureDbContext db, CancellationToken ct) =>
        {
            var items = await db.ValidationEvidences.AsNoTracking().Where(x => x.ProjectId == projectId).OrderByDescending(x => x.ExecutedAtUtc).ToListAsync(ct);
            return Results.Ok(items.Select(x => new { x.Id, category = x.Category.ToString(), result = x.Result.ToString(), x.Title, x.Evidence, x.ExecutedBy, x.ExecutedAtUtc }));
        });

        group.MapPost("/validation", async (Guid projectId, CreateValidationEvidenceRequest request, ClaimsPrincipal principal, QAssureDbContext db, CancellationToken ct) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, ct)) return Results.NotFound(new { message = "Project not found." });
            try
            {
                var evidence = new ValidationEvidence(projectId, request.Category, request.Result, request.Title, request.Evidence, principal.Identity?.Name ?? "QA user");
                db.ValidationEvidences.Add(evidence);
                await db.SaveChangesAsync(ct);
                return Results.Created($"/api/projects/{projectId}/quality/validation/{evidence.Id}", new { evidence.Id, category = evidence.Category.ToString(), result = evidence.Result.ToString(), evidence.Title, evidence.Evidence, evidence.ExecutedBy, evidence.ExecutedAtUtc });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).RequireAuthorization("QaLeadOrAdmin");

        return endpoints;
    }

    private static async Task<object> BuildReport(Guid projectId, QAssureDbContext db, CancellationToken ct)
    {
        var requirements = await db.Requirements.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
        var cases = await db.TestCases.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
        var runs = await db.TestRuns.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
        var runIds = runs.Select(x => x.Id).ToArray();
        var executions = await db.TestExecutions.AsNoTracking().Where(x => runIds.Contains(x.TestRunId)).ToListAsync(ct);
        var defects = await db.Defects.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
        var risks = await db.Risks.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
        var validation = await db.ValidationEvidences.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);

        var coveredReqIds = cases.Where(x => x.RequirementId != null).Select(x => x.RequirementId!.Value).Distinct().Count();
        var reqCoverage = requirements.Count == 0 ? 0 : Math.Round(coveredReqIds * 100d / requirements.Count, 1);
        var finalExecutions = executions.Where(x => x.Result != TestExecutionResult.NotRun).ToArray();
        var passRate = finalExecutions.Length == 0 ? 0 : Math.Round(finalExecutions.Count(x => x.Result == TestExecutionResult.Passed) * 100d / finalExecutions.Length, 1);
        var validationPassed = Enum.GetValues<ValidationCategory>().Count(category => validation.Any(x => x.Category == category && x.Result == ValidationResult.Passed));

        var gate = QualityGateEvaluator.Evaluate(new QualityGateInput(
            reqCoverage,
            passRate,
            runs.Count(x => x.Status == TestRunStatus.Completed),
            executions.Count(x => x.Result == TestExecutionResult.NotRun && runs.Any(r => r.Id == x.TestRunId && r.Status == TestRunStatus.InProgress)),
            defects.Count(x => x.Severity == DefectSeverity.Critical && x.Status != DefectStatus.Closed),
            risks.Count(x => x.Level == RiskLevel.Critical && x.Status == RiskStatus.Open),
            validationPassed));

        return new
        {
            generatedAtUtc = DateTimeOffset.UtcNow,
            metrics = new
            {
                requirements = requirements.Count,
                approvedRequirements = requirements.Count(x => x.Status.ToString() == "Approved"),
                requirementCoverage = reqCoverage,
                testCases = cases.Count,
                readyTestCases = cases.Count(x => x.Status == TestCaseStatus.Ready),
                testRuns = runs.Count,
                completedRuns = runs.Count(x => x.Status == TestRunStatus.Completed),
                executions = executions.Count,
                passed = executions.Count(x => x.Result == TestExecutionResult.Passed),
                failed = executions.Count(x => x.Result == TestExecutionResult.Failed),
                blocked = executions.Count(x => x.Result == TestExecutionResult.Blocked),
                passRate,
                defects = defects.Count,
                openDefects = defects.Count(x => x.Status != DefectStatus.Closed),
                criticalOpenDefects = defects.Count(x => x.Severity == DefectSeverity.Critical && x.Status != DefectStatus.Closed),
                validationAreasPassed = validationPassed
            },
            gate = new { decision = gate.Decision.ToString(), checks = gate.Checks }
        };
    }

    private sealed record CreateValidationEvidenceRequest(ValidationCategory Category, ValidationResult Result, string Title, string Evidence);
}
