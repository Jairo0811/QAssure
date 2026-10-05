using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Testing;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class TestCasesEndpoints
{
    public static IEndpointRouteBuilder MapTestCasesEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/test-cases")
            .WithTags("Test Cases")
            .RequireAuthorization();

        group.MapGet("/", async (Guid projectId, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var cases = await db.TestCases
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId)
                .OrderBy(x => x.Code)
                .ToListAsync(cancellationToken);

            return Results.Ok(cases.Select(ToResponse));
        });

        group.MapPost("/", async (
            Guid projectId,
            CreateTestCaseRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var traceabilityError = await ValidateTraceabilityAsync(
                db,
                projectId,
                request.RequirementId,
                request.RiskId,
                cancellationToken);
            if (traceabilityError is not null)
                return Results.BadRequest(new { message = traceabilityError });

            try
            {
                var testCase = new TestCase(
                    projectId,
                    request.RequirementId,
                    request.RiskId,
                    request.Code,
                    request.Title,
                    request.Level,
                    request.Type,
                    request.Technique,
                    request.Priority,
                    request.Objective,
                    request.Preconditions,
                    request.Steps,
                    request.TestData,
                    request.ExpectedResult,
                    request.Postconditions);

                if (await db.TestCases.AnyAsync(x => x.ProjectId == projectId && x.Code == testCase.Code, cancellationToken))
                    return Results.Conflict(new { message = $"Test case code '{testCase.Code}' already exists in this project." });

                db.TestCases.Add(testCase);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/projects/{projectId}/test-cases/{testCase.Id}", ToResponse(testCase));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPut("/{id:guid}", async (
            Guid projectId,
            Guid id,
            UpdateTestCaseRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var testCase = await db.TestCases.SingleOrDefaultAsync(
                x => x.Id == id && x.ProjectId == projectId,
                cancellationToken);
            if (testCase is null)
                return Results.NotFound();

            var traceabilityError = await ValidateTraceabilityAsync(
                db,
                projectId,
                request.RequirementId,
                request.RiskId,
                cancellationToken);
            if (traceabilityError is not null)
                return Results.BadRequest(new { message = traceabilityError });

            try
            {
                testCase.UpdateDesign(
                    request.Title,
                    request.Level,
                    request.Type,
                    request.Technique,
                    request.Priority,
                    request.Objective,
                    request.Preconditions,
                    request.Steps,
                    request.TestData,
                    request.ExpectedResult,
                    request.Postconditions,
                    request.RequirementId,
                    request.RiskId);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(testCase));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/ready", async (
            Guid projectId,
            Guid id,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var testCase = await db.TestCases.SingleOrDefaultAsync(
                x => x.Id == id && x.ProjectId == projectId,
                cancellationToken);
            if (testCase is null)
                return Results.NotFound();

            try
            {
                testCase.MarkReady();
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(testCase));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/draft", async (
            Guid projectId,
            Guid id,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var testCase = await db.TestCases.SingleOrDefaultAsync(
                x => x.Id == id && x.ProjectId == projectId,
                cancellationToken);
            if (testCase is null)
                return Results.NotFound();

            try
            {
                testCase.ReturnToDraft();
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(testCase));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        return endpoints;
    }

    private static async Task<string?> ValidateTraceabilityAsync(
        QAssureDbContext db,
        Guid projectId,
        Guid? requirementId,
        Guid? riskId,
        CancellationToken cancellationToken)
    {
        if (requirementId is not null && !await db.Requirements.AnyAsync(
                x => x.Id == requirementId.Value && x.ProjectId == projectId,
                cancellationToken))
            return "The linked requirement does not belong to this project.";

        if (riskId is not null && !await db.Risks.AnyAsync(
                x => x.Id == riskId.Value && x.ProjectId == projectId,
                cancellationToken))
            return "The linked risk does not belong to this project.";

        return null;
    }

    private static TestCaseResponse ToResponse(TestCase testCase) => new(
        testCase.Id,
        testCase.ProjectId,
        testCase.RequirementId,
        testCase.RiskId,
        testCase.Code,
        testCase.Title,
        testCase.Level.ToString(),
        testCase.Type.ToString(),
        testCase.Technique.ToString(),
        testCase.Priority.ToString(),
        testCase.Status.ToString(),
        testCase.Objective,
        testCase.Preconditions,
        testCase.Steps,
        testCase.TestData,
        testCase.ExpectedResult,
        testCase.Postconditions);

    private sealed record CreateTestCaseRequest(
        Guid? RequirementId,
        Guid? RiskId,
        string Code,
        string Title,
        TestLevel Level,
        TestType Type,
        TestTechnique Technique,
        TestPriority Priority,
        string Objective,
        string Preconditions,
        string Steps,
        string TestData,
        string ExpectedResult,
        string Postconditions);

    private sealed record UpdateTestCaseRequest(
        Guid? RequirementId,
        Guid? RiskId,
        string Title,
        TestLevel Level,
        TestType Type,
        TestTechnique Technique,
        TestPriority Priority,
        string Objective,
        string Preconditions,
        string Steps,
        string TestData,
        string ExpectedResult,
        string Postconditions);

    private sealed record TestCaseResponse(
        Guid Id,
        Guid ProjectId,
        Guid? RequirementId,
        Guid? RiskId,
        string Code,
        string Title,
        string Level,
        string Type,
        string Technique,
        string Priority,
        string Status,
        string Objective,
        string Preconditions,
        string Steps,
        string TestData,
        string ExpectedResult,
        string Postconditions);
}
