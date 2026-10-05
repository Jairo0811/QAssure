using Microsoft.EntityFrameworkCore;
using QAssure.Domain.Projects;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class ProjectsEndpoints
{
    public static IEndpointRouteBuilder MapProjectsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects")
            .WithTags("Projects")
            .RequireAuthorization();

        group.MapGet("/", async (QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            var projects = await db.Projects
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .Select(x => new ProjectResponse(
                    x.Id,
                    x.Name,
                    x.Key,
                    x.Description,
                    x.Version,
                    x.Criticality.ToString(),
                    x.Status.ToString(),
                    x.CreatedAtUtc))
                .ToListAsync(cancellationToken);

            return Results.Ok(projects);
        });

        group.MapGet("/{id:guid}", async (Guid id, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            var project = await db.Projects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            return project is null
                ? Results.NotFound()
                : Results.Ok(ToResponse(project));
        });

        group.MapPost("/", async (CreateProjectRequest request, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            try
            {
                var project = new Project(
                    request.Name,
                    request.Key,
                    request.Description ?? string.Empty,
                    request.Version ?? "0.1.0",
                    request.Criticality);

                if (await db.Projects.AnyAsync(x => x.Key == project.Key, cancellationToken))
                    return Results.Conflict(new { message = $"Project key '{project.Key}' already exists." });

                db.Projects.Add(project);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/projects/{project.Id}", ToResponse(project));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaLeadOrAdmin");

        group.MapPut("/{id:guid}", async (Guid id, UpdateProjectRequest request, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            var project = await db.Projects.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (project is null)
                return Results.NotFound();

            try
            {
                project.Rename(request.Name);
                project.UpdateDetails(request.Description ?? string.Empty, request.Version ?? project.Version, request.Criticality);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(project));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthorization("QaLeadOrAdmin");

        group.MapPost("/{id:guid}/activate", async (Guid id, QAssureDbContext db, CancellationToken cancellationToken) =>
        {
            var project = await db.Projects.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (project is null)
                return Results.NotFound();

            try
            {
                project.Activate();
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(project));
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }).RequireAuthorization("QaLeadOrAdmin");

        return endpoints;
    }

    private static ProjectResponse ToResponse(Project project) => new(
        project.Id,
        project.Name,
        project.Key,
        project.Description,
        project.Version,
        project.Criticality.ToString(),
        project.Status.ToString(),
        project.CreatedAtUtc);

    private sealed record CreateProjectRequest(
        string Name,
        string Key,
        string? Description,
        string? Version,
        ProjectCriticality Criticality = ProjectCriticality.Medium);

    private sealed record UpdateProjectRequest(
        string Name,
        string? Description,
        string? Version,
        ProjectCriticality Criticality);

    private sealed record ProjectResponse(
        Guid Id,
        string Name,
        string Key,
        string Description,
        string Version,
        string Criticality,
        string Status,
        DateTimeOffset CreatedAtUtc);
}
