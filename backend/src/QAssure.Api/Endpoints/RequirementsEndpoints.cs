using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Requirements;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class RequirementsEndpoints
{
    public static IEndpointRouteBuilder MapRequirementsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects/{projectId:guid}/requirements")
            .WithTags("Requirements")
            .RequireAuthorization();

        group.MapGet("/", async (Guid projectId, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            var requirements = await db.Requirements
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId)
                .OrderBy(x => x.Code)
                .Select(x => new RequirementResponse(
                    x.Id,
                    x.ProjectId,
                    x.Code,
                    x.Title,
                    x.Description,
                    x.AcceptanceCriteria,
                    x.Type.ToString(),
                    x.Priority.ToString(),
                    x.Status.ToString()))
                .ToListAsync(cancellationToken);

            return Results.Ok(requirements);
        });

        group.MapPost("/", async (
            Guid projectId,
            CreateRequirementRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!await db.Projects.AnyAsync(x => x.Id == projectId, cancellationToken))
                return Results.NotFound(new { message = "Project not found." });

            try
            {
                var requirement = new Requirement(
                    projectId,
                    request.Code,
                    request.Title,
                    request.Description,
                    request.AcceptanceCriteria,
                    request.Type,
                    request.Priority);

                if (await db.Requirements.AnyAsync(
                    x => x.ProjectId == projectId && x.Code == requirement.Code,
                    cancellationToken))
                    return Results.Conflict(new { message = $"Requirement code '{requirement.Code}' already exists in this project." });

                db.Requirements.Add(requirement);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/projects/{projectId}/requirements/{requirement.Id}", ToResponse(requirement));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPut("/{id:guid}", async (
            Guid projectId,
            Guid id,
            UpdateRequirementRequest request,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var requirement = await db.Requirements.SingleOrDefaultAsync(
                x => x.Id == id && x.ProjectId == projectId,
                cancellationToken);
            if (requirement is null)
                return Results.NotFound();

            try
            {
                requirement.Update(
                    request.Title,
                    request.Description,
                    request.AcceptanceCriteria,
                    request.Type,
                    request.Priority);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(requirement));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaTeam");

        group.MapPost("/{id:guid}/approve", async (
            Guid projectId,
            Guid id,
            QAssureDbContext db,
            CancellationToken cancellationToken) =>
        {
            var requirement = await db.Requirements.SingleOrDefaultAsync(
                x => x.Id == id && x.ProjectId == projectId,
                cancellationToken);
            if (requirement is null)
                return Results.NotFound();

            requirement.Approve();
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToResponse(requirement));
        }).RequireAuthorization("QaLeadOrAdmin");

        return endpoints;
    }

    private static RequirementResponse ToResponse(Requirement requirement) => new(
        requirement.Id,
        requirement.ProjectId,
        requirement.Code,
        requirement.Title,
        requirement.Description,
        requirement.AcceptanceCriteria,
        requirement.Type.ToString(),
        requirement.Priority.ToString(),
        requirement.Status.ToString());

    private sealed record CreateRequirementRequest(
        string Code,
        string Title,
        string Description,
        string AcceptanceCriteria,
        RequirementType Type = RequirementType.Functional,
        RequirementPriority Priority = RequirementPriority.Medium);

    private sealed record UpdateRequirementRequest(
        string Title,
        string Description,
        string AcceptanceCriteria,
        RequirementType Type,
        RequirementPriority Priority);

    private sealed record RequirementResponse(
        Guid Id,
        Guid ProjectId,
        string Code,
        string Title,
        string Description,
        string AcceptanceCriteria,
        string Type,
        string Priority,
        string Status);
}
