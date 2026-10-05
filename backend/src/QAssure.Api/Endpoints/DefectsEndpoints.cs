using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Defects;
using QAssure.Domain.Testing;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class DefectsEndpoints
{
    public static IEndpointRouteBuilder MapDefectsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/defects").WithTags("Defects").RequireAuthorization();

        group.MapGet("/", async (Guid projectId, QAssureDbContext db, CancellationToken ct) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, ct)) return Results.NotFound(new { message = "Project not found." });
            var defects = await db.Defects.AsNoTracking().Where(x => x.ProjectId == projectId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
            var testCases = await db.TestCases.AsNoTracking().Where(x => x.ProjectId == projectId).ToDictionaryAsync(x => x.Id, ct);
            return Results.Ok(defects.Select(x => ToResponse(x, testCases.GetValueOrDefault(x.TestCaseId)?.Code ?? "")));
        });

        group.MapPost("/", async (Guid projectId, CreateDefectRequest request, QAssureDbContext db, CancellationToken ct) =>
        {
            var execution = await db.TestExecutions.SingleOrDefaultAsync(x => x.Id == request.ExecutionId, ct);
            if (execution is null) return Results.BadRequest(new { message = "Execution not found." });
            var testCase = await db.TestCases.SingleOrDefaultAsync(x => x.Id == execution.TestCaseId && x.ProjectId == projectId, ct);
            if (testCase is null) return Results.BadRequest(new { message = "Execution does not belong to this project." });
            if (execution.Result is not (TestExecutionResult.Failed or TestExecutionResult.Blocked))
                return Results.BadRequest(new { message = "Only Failed or Blocked executions can originate a defect." });

            try
            {
                var defect = new Defect(projectId, execution.Id, testCase.Id, request.Code, request.Title, request.Severity, request.Priority,
                    request.Description, request.ReproductionSteps, testCase.ExpectedResult, execution.ActualResult);
                if (await db.Defects.AnyAsync(x => x.ProjectId == projectId && x.Code == defect.Code, ct))
                    return Results.Conflict(new { message = $"Defect code '{defect.Code}' already exists." });
                db.Defects.Add(defect);
                await db.SaveChangesAsync(ct);
                return Results.Created($"/api/projects/{projectId}/defects/{defect.Id}", ToResponse(defect, testCase.Code));
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/start", async (Guid projectId, Guid id, StartDefectRequest request, QAssureDbContext db, CancellationToken ct) =>
        {
            var defect = await db.Defects.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, ct);
            if (defect is null) return Results.NotFound();
            try { defect.StartWork(request.AssignedTo); await db.SaveChangesAsync(ct); return Results.Ok(ToResponse(defect, "")); }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException) { return Results.Conflict(new { message = ex.Message }); }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/resolve", async (Guid projectId, Guid id, ResolveDefectRequest request, QAssureDbContext db, CancellationToken ct) =>
        {
            var defect = await db.Defects.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, ct);
            if (defect is null) return Results.NotFound();
            try { defect.Resolve(request.Resolution); await db.SaveChangesAsync(ct); return Results.Ok(ToResponse(defect, "")); }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException) { return Results.Conflict(new { message = ex.Message }); }
        }).RequireAuthorization("QaLeadOrAdmin");

        group.MapPost("/{id:guid}/verify-retest", async (Guid projectId, Guid id, VerifyRetestRequest request, QAssureDbContext db, CancellationToken ct) =>
        {
            var defect = await db.Defects.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, ct);
            if (defect is null) return Results.NotFound();
            var execution = await db.TestExecutions.SingleOrDefaultAsync(x => x.Id == request.RetestExecutionId && x.TestCaseId == defect.TestCaseId, ct);
            if (execution is null || execution.Result == TestExecutionResult.NotRun)
                return Results.BadRequest(new { message = "A final re-test execution for the same test case is required." });
            try
            {
                defect.VerifyRetest(execution.Id, execution.Result == TestExecutionResult.Passed);
                await db.SaveChangesAsync(ct);
                return Results.Ok(ToResponse(defect, ""));
            }
            catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
        }).RequireAuthorization("QaTeam");

        return endpoints;
    }

    private static object ToResponse(Defect x, string testCaseCode) => new
    {
        x.Id, x.ProjectId, x.ExecutionId, x.TestCaseId, x.RetestExecutionId, testCaseCode, x.Code, x.Title,
        severity = x.Severity.ToString(), priority = x.Priority.ToString(), status = x.Status.ToString(),
        x.Description, x.ReproductionSteps, x.ExpectedResult, x.ActualResult, x.AssignedTo, x.Resolution, x.CreatedAtUtc, x.UpdatedAtUtc
    };

    private sealed record CreateDefectRequest(Guid ExecutionId, string Code, string Title, DefectSeverity Severity, DefectPriority Priority, string Description, string ReproductionSteps);
    private sealed record StartDefectRequest(string AssignedTo);
    private sealed record ResolveDefectRequest(string Resolution);
    private sealed record VerifyRetestRequest(Guid RetestExecutionId);
}
