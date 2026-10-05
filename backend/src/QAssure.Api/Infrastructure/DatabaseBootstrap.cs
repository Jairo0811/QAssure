using Microsoft.EntityFrameworkCore;
using QAssure.Api.Security;
using QAssure.Domain.Users;
using QAssure.Infrastructure.Persistence;

namespace QAssure.Api.Infrastructure;

internal static class DatabaseBootstrap
{
    public static async Task InitialiseAsync(WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<QAssureDbContext>();

        await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
            return;

        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var email = configuration["BootstrapAdmin:Email"] ?? "admin@qassure.local";
        var displayName = configuration["BootstrapAdmin:DisplayName"] ?? "QAssure Administrator";
        var password = configuration["BootstrapAdmin:Password"] ?? "QAssure.Local123!";

        db.Users.Add(new UserAccount(email, displayName, PasswordHasher.Hash(password), UserRole.Admin));
        await db.SaveChangesAsync();
    }
}
