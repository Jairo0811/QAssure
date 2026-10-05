using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Testing;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class TestRunsEndpoints
{
    public static IEndpointRouteBuilder MapTestRunsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/test-runs")
            .WithTags("Test Runs")
            .RequireAuthorization();

        group.MapGet("/", async (Guid projectId, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var runs = await db.TestRuns
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync(cancellationToken);

            var executionRows = await db.TestExecutions
                .AsNoTracking()
                .Where(x => runs.Select(run => run.Id).Contains(x.TestRunId))
                .Select(x => new { x.TestRunId, x.Result })
                .ToListAsync(cancellationToken);

            return Results.Ok(runs.Select(run => ToSummary(run, executionRows
                .Where(x => x.TestRunId == run.Id)
                .Select(x => x.Result))));
        });

        group.MapGet("/{runId:guid}", async (
            Guid projectId,
            Guid runId,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var run = await db.TestRuns.AsNoTracking().SingleOrDefaultAsync(
                x => x.Id == runId && x.ProjectId == projectId,
                cancellationToken);
            if (run is null)
                return Results.NotFound();

            var executions = await (
                from execution in db.TestExecutions.AsNoTracking()
                join testCase in db.TestCases.AsNoTracking() on execution.TestCaseId equals testCase.Id
                where execution.TestRunId == runId
                orderby testCase.Code
                select new TestExecutionResponse(
                    execution.Id,
                    execution.TestCaseId,
                    testCase.Code,
                    testCase.Title,
                    testCase.Priority.ToString(),
                    testCase.ExpectedResult,
                    execution.Result.ToString(),
                    execution.ActualResult,
                    execution.Notes,
                    execution.Evidence,
                    execution.ExecutedBy,
                    execution.ExecutedAtUtc))
                .ToListAsync(cancellationToken);

            return Results.Ok(new TestRunDetailResponse(
                ToSummary(run, executions.Select(x => Enum.Parse<TestExecutionResult>(x.Result))),
                executions));
        });

        group.MapPost("/", async (
            Guid projectId,
            CreateTestRunRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var requestedIds = (request.TestCaseIds ?? []).Distinct().ToArray();
            if (requestedIds.Length == 0)
                return Results.BadRequest(new { message = "Select at least one ready test case for the run." });

            var cases = await db.TestCases
                .Where(x => x.ProjectId == projectId && requestedIds.Contains(x.Id))
                .ToListAsync(cancellationToken);

            if (cases.Count != requestedIds.Length)
                return Results.BadRequest(new { message = "One or more selected test cases do not belong to this project." });
            if (cases.Any(x => x.Status != TestCaseStatus.Ready))
                return Results.BadRequest(new { message = "Only Ready test cases can be added to a test run." });

            try
            {
                var run = new TestRun(projectId, request.Name, request.BuildVersion, request.Environment, request.Type);
                db.TestRuns.Add(run);
                db.TestExecutions.AddRange(cases.Select(testCase => new TestExecution(run.Id, testCase.Id)));
                await db.SaveChangesAsync(cancellationToken);

                return Results.Created(
                    $"/api/projects/{projectId}/test-runs/{run.Id}",
                    ToSummary(run, Enumerable.Repeat(TestExecutionResult.NotRun, cases.Count)));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{runId:guid}/start", async (
            Guid projectId,
            Guid runId,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var run = await db.TestRuns.SingleOrDefaultAsync(
                x => x.Id == runId && x.ProjectId == projectId,
                cancellationToken);
            if (run is null)
                return Results.NotFound();

            var executionCount = await db.TestExecutions.CountAsync(x => x.TestRunId == runId, cancellationToken);
            try
            {
                run.Start(executionCount);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(await BuildSummaryAsync(db, run, cancellationToken));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPut("/{runId:guid}/executions/{executionId:guid}", async (
            Guid projectId,
            Guid runId,
            Guid executionId,
            RecordExecutionRequest request,
            ClaimsPrincipal principal,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var run = await db.TestRuns.SingleOrDefaultAsync(
                x => x.Id == runId && x.ProjectId == projectId,
                cancellationToken);
            if (run is null)
                return Results.NotFound(new { message = "Test run not found." });
            if (run.Status != TestRunStatus.InProgress)
                return Results.Conflict(new { message = "Executions can only be recorded while the test run is in progress." });

            var execution = await db.TestExecutions.SingleOrDefaultAsync(
                x => x.Id == executionId && x.TestRunId == runId,
                cancellationToken);
            if (execution is null)
                return Results.NotFound(new { message = "Execution not found." });

            try
            {
                execution.RecordResult(
                    request.Result,
                    request.ActualResult,
                    request.Notes,
                    request.Evidence,
                    principal.Identity?.Name ?? "QA user");
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(new
                {
                    execution.Id,
                    execution.TestCaseId,
                    result = execution.Result.ToString(),
                    execution.ActualResult,
                    execution.Notes,
                    execution.Evidence,
                    execution.ExecutedBy,
                    execution.ExecutedAtUtc
                });
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{runId:guid}/complete", async (
            Guid projectId,
            Guid runId,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var run = await db.TestRuns.SingleOrDefaultAsync(
                x => x.Id == runId && x.ProjectId == projectId,
                cancellationToken);
            if (run is null)
                return Results.NotFound();

            var pending = await db.TestExecutions.CountAsync(
                x => x.TestRunId == runId && x.Result == TestExecutionResult.NotRun,
                cancellationToken);

            try
            {
                run.Complete(pending);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(await BuildSummaryAsync(db, run, cancellationToken));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{runId:guid}/cancel", async (
            Guid projectId,
            Guid runId,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var run = await db.TestRuns.SingleOrDefaultAsync(
                x => x.Id == runId && x.ProjectId == projectId,
                cancellationToken);
            if (run is null)
                return Results.NotFound();

            try
            {
                run.Cancel();
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(await BuildSummaryAsync(db, run, cancellationToken));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaLeadOrAdmin");

        return endpoints;
    }

    private static async Task<TestRunSummaryResponse> BuildSummaryAsync(
        QAssureDbContext db,
        TestRun run,
        CancellationToken cancellationToken)
    {
        var results = await db.TestExecutions
            .AsNoTracking()
            .Where(x => x.TestRunId == run.Id)
            .Select(x => x.Result)
            .ToListAsync(cancellationToken);
        return ToSummary(run, results);
    }

    private static TestRunSummaryResponse ToSummary(TestRun run, IEnumerable<TestExecutionResult> source)
    {
        var results = source.ToArray();
        var passed = results.Count(x => x == TestExecutionResult.Passed);
        var executed = results.Count(x => x != TestExecutionResult.NotRun);
        var passRate = executed == 0 ? 0 : Math.Round(passed * 100d / executed, 1);

        return new TestRunSummaryResponse(
            run.Id,
            run.ProjectId,
            run.Name,
            run.BuildVersion,
            run.Environment.ToString(),
            run.Type.ToString(),
            run.Status.ToString(),
            run.CreatedAtUtc,
            run.StartedAtUtc,
            run.CompletedAtUtc,
            results.Length,
            results.Count(x => x == TestExecutionResult.NotRun),
            passed,
            results.Count(x => x == TestExecutionResult.Failed),
            results.Count(x => x == TestExecutionResult.Blocked),
            results.Count(x => x == TestExecutionResult.Skipped),
            passRate);
    }

    private sealed record CreateTestRunRequest(
        string Name,
        string BuildVersion,
        QaEnvironment Environment,
        TestRunType Type,
        Guid[]? TestCaseIds);

    private sealed record RecordExecutionRequest(
        TestExecutionResult Result,
        string ActualResult,
        string? Notes,
        string? Evidence);

    private sealed record TestRunSummaryResponse(
        Guid Id,
        Guid ProjectId,
        string Name,
        string BuildVersion,
        string Environment,
        string Type,
        string Status,
        DateTimeOffset CreatedAtUtc,
        DateTimeOffset? StartedAtUtc,
        DateTimeOffset? CompletedAtUtc,
        int Total,
        int NotRun,
        int Passed,
        int Failed,
        int Blocked,
        int Skipped,
        double PassRate);

    private sealed record TestExecutionResponse(
        Guid Id,
        Guid TestCaseId,
        string TestCaseCode,
        string TestCaseTitle,
        string Priority,
        string ExpectedResult,
        string Result,
        string ActualResult,
        string Notes,
        string Evidence,
        string ExecutedBy,
        DateTimeOffset? ExecutedAtUtc);

    private sealed record TestRunDetailResponse(
        TestRunSummaryResponse Run,
        IReadOnlyList<TestExecutionResponse> Executions);
}
