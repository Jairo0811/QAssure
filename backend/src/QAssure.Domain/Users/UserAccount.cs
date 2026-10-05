using QAssure.Domain.Common;

namespace QAssure.Domain.Users;

public sealed class UserAccount : Entity
{
    private UserAccount() { }

    public UserAccount(string email, string displayName, string passwordHash, UserRole role)
    {
        Email = NormalizeEmail(email);
        DisplayName = NormalizeDisplayName(displayName);
        PasswordHash = string.IsNullOrWhiteSpace(passwordHash)
            ? throw new ArgumentException("Password hash is required.", nameof(passwordHash))
            : passwordHash;
        Role = role;
    }

    public string Email { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.Tester;
    public bool IsActive { get; private set; } = true;

    public void ChangePassword(string passwordHash)
    {
        PasswordHash = string.IsNullOrWhiteSpace(passwordHash)
            ? throw new ArgumentException("Password hash is required.", nameof(passwordHash))
            : passwordHash;
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (normalized.Length is < 5 or > 254 || !normalized.Contains('@'))
            throw new ArgumentException("A valid email address is required.", nameof(email));
        return normalized;
    }

    private static string NormalizeDisplayName(string displayName)
    {
        var normalized = displayName?.Trim() ?? string.Empty;
        if (normalized.Length is < 2 or > 120)
            throw new ArgumentException("Display name must contain 2-120 characters.", nameof(displayName));
        return normalized;
    }
}

public enum UserRole
{
    Admin = 1,
    QaLead = 2,
    Tester = 3,
    Developer = 4,
    Stakeholder = 5
}
