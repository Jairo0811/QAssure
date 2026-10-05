using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Defects;
using QAssure.Domain.Testing;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class TraceabilityEndpoints
{
    public static IEndpointRouteBuilder MapTraceabilityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/projects/{projectId:guid}/traceability", async (Guid projectId, QAssureDbContext db, CancellationToken ct) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, ct)) return Results.NotFound(new { message = "Project not found." });

            var requirements = await db.Requirements.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.Code).ToListAsync(ct);
            var risks = await db.Risks.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
            var cases = await db.TestCases.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);
            var caseIds = cases.Select(x => x.Id).ToArray();
            var executions = await db.TestExecutions.AsNoTracking().Where(x => caseIds.Contains(x.TestCaseId)).ToListAsync(ct);
            var defects = await db.Defects.AsNoTracking().Where(x => x.ProjectId == projectId).ToListAsync(ct);

            var rows = requirements.Select(req =>
            {
                var linkedRisks = risks.Where(x => x.RequirementId == req.Id).ToArray();
                var linkedCases = cases.Where(x => x.RequirementId == req.Id).ToArray();
                var linkedCaseIds = linkedCases.Select(x => x.Id).ToHashSet();
                var linkedExecutions = executions.Where(x => linkedCaseIds.Contains(x.TestCaseId)).ToArray();
                var linkedDefects = defects.Where(x => linkedCaseIds.Contains(x.TestCaseId)).ToArray();
                return new
                {
                    requirementId = req.Id, req.Code, req.Title, requirementStatus = req.Status.ToString(),
                    risks = linkedRisks.Select(x => new { x.Id, x.Code, level = x.Level.ToString(), status = x.Status.ToString() }),
                    testCases = linkedCases.Select(x => new { x.Id, x.Code, x.Title, status = x.Status.ToString(), technique = x.Technique.ToString() }),
                    executions = linkedExecutions.Length,
                    passed = linkedExecutions.Count(x => x.Result == TestExecutionResult.Passed),
                    failed = linkedExecutions.Count(x => x.Result == TestExecutionResult.Failed),
                    openDefects = linkedDefects.Count(x => x.Status is not DefectStatus.Closed),
                    covered = linkedCases.Length > 0
                };
            }).ToArray();

            var covered = rows.Count(x => x.covered);
            var coverage = requirements.Count == 0 ? 0 : Math.Round(covered * 100d / requirements.Count, 1);
            var executed = executions.Count(x => x.Result != TestExecutionResult.NotRun);
            var executionCoverage = executions.Count == 0 ? 0 : Math.Round(executed * 100d / executions.Count, 1);

            return Results.Ok(new
            {
                summary = new { requirements = requirements.Count, coveredRequirements = covered, requirementCoverage = coverage, testCases = cases.Count, executions = executions.Count, executionCoverage, defects = defects.Count, openDefects = defects.Count(x => x.Status != DefectStatus.Closed) },
                rows
            });
        }).WithTags("Traceability").RequireAuthorization();

        return endpoints;
    }
}
