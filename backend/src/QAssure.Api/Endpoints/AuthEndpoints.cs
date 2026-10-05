using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QAssure.Api.Security;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Endpoints;

internal static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/login", async (
            LoginRequest request,
            QAssureDbContext db,
            IConfiguration configuration,
            CancellationToken cancellationToken) =>
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);

            if (user is null || !user.IsActive || !PasswordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash))
                return Results.Unauthorized();

            var token = JwtTokenFactory.Create(user, configuration);
            var expirationMinutes = configuration.GetValue("Jwt:ExpirationMinutes", 480);

            return Results.Ok(new AuthResponse(
                token,
                DateTimeOffset.UtcNow.AddMinutes(expirationMinutes),
                new CurrentUserResponse(user.Id, user.Email, user.DisplayName, user.Role.ToString())));
        }).AllowAnonymous();

        group.MapGet("/me", (ClaimsPrincipal principal) =>
        {
            var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            return Results.Ok(new
            {
                id,
                email = principal.FindFirstValue(ClaimTypes.Email),
                displayName = principal.Identity?.Name,
                role = principal.FindFirstValue(ClaimTypes.Role)
            });
        }).RequireAuthorization();

        return endpoints;
    }

    private sealed record LoginRequest(string? Email, string? Password);
    private sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAtUtc, CurrentUserResponse User);
    private sealed record CurrentUserResponse(Guid Id, string Email, string DisplayName, string Role);
}
