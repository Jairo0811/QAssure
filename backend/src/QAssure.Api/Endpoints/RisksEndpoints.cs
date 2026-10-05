using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Risks;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class RisksEndpoints
{
    public static IEndpointRouteBuilder MapRisksEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/risks")
            .WithTags("Risks")
            .RequireAuthorization();

        group.MapGet("/", async (Guid projectId, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var risks = await db.Risks
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId)
                .OrderByDescending(x => x.Probability * x.Impact)
                .ThenBy(x => x.Code)
                .ToListAsync(cancellationToken);

            return Results.Ok(risks.Select(ToResponse));
        });

        group.MapPost("/", async (
            Guid projectId,
            CreateRiskRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            if (!await RequirementBelongsToProjectAsync(db, projectId, request.RequirementId, cancellationToken))
                return Results.BadRequest(new { message = "The linked requirement does not belong to this project." });

            try
            {
                var risk = new RiskItem(
                    projectId,
                    request.RequirementId,
                    request.Code,
                    request.Title,
                    request.Description,
                    request.Probability,
                    request.Impact,
                    request.Mitigation);

                if (await db.Risks.AnyAsync(x => x.ProjectId == projectId && x.Code == risk.Code, cancellationToken))
                    return Results.Conflict(new { message = $"Risk code '{risk.Code}' already exists in this project." });

                db.Risks.Add(risk);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/projects/{projectId}/risks/{risk.Id}", ToResponse(risk));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPut("/{id:guid}", async (
            Guid projectId,
            Guid id,
            UpdateRiskRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var risk = await db.Risks.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, cancellationToken);
            if (risk is null)
                return Results.NotFound();

            if (!await RequirementBelongsToProjectAsync(db, projectId, request.RequirementId, cancellationToken))
                return Results.BadRequest(new { message = "The linked requirement does not belong to this project." });

            try
            {
                risk.Update(
                    request.Title,
                    request.Description,
                    request.Probability,
                    request.Impact,
                    request.Mitigation,
                    request.RequirementId);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(risk));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/mitigate", async (
            Guid projectId,
            Guid id,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var risk = await db.Risks.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, cancellationToken);
            if (risk is null)
                return Results.NotFound();

            risk.MarkMitigated();
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToResponse(risk));
        }).RequireAuthorization("QaLeadOrAdmin");

        group.MapPost("/{id:guid}/accept", async (
            Guid projectId,
            Guid id,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var risk = await db.Risks.SingleOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, cancellationToken);
            if (risk is null)
                return Results.NotFound();

            risk.Accept();
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToResponse(risk));
        }).RequireAuthorization("QaLeadOrAdmin");

        return endpoints;
    }

    private static async Task<bool> RequirementBelongsToProjectAsync(
        QAssureDbContext db,
        Guid projectId,
        Guid? requirementId,
        CancellationToken cancellationToken)
    {
        if (requirementId is null)
            return true;

        return await db.Requirements.AnyAsync(
            x => x.Id == requirementId.Value && x.ProjectId == projectId,
            cancellationToken);
    }

    private static RiskResponse ToResponse(RiskItem risk) => new(
        risk.Id,
        risk.ProjectId,
        risk.RequirementId,
        risk.Code,
        risk.Title,
        risk.Description,
        risk.Probability,
        risk.Impact,
        risk.Score,
        risk.Level.ToString(),
        risk.Mitigation,
        risk.Status.ToString());

    private sealed record CreateRiskRequest(
        Guid? RequirementId,
        string Code,
        string Title,
        string Description,
        int Probability,
        int Impact,
        string Mitigation);

    private sealed record UpdateRiskRequest(
        Guid? RequirementId,
        string Title,
        string Description,
        int Probability,
        int Impact,
        string Mitigation);

    private sealed record RiskResponse(
        Guid Id,
        Guid ProjectId,
        Guid? RequirementId,
        string Code,
        string Title,
        string Description,
        int Probability,
        int Impact,
        int Score,
        string Level,
        string Mitigation,
        string Status);
}
