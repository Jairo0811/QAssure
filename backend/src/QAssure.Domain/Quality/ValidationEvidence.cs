using QAssure.Domain.Common;

namespace QAssure.Domain.Quality;

public sealed class ValidationEvidence : Entity
{
    private ValidationEvidence() { }

    public ValidationEvidence(Guid projectId, ValidationCategory category, ValidationResult result, string title, string evidence, string executedBy)
    {
        if (projectId == Guid.Empty) throw new ArgumentException("Project is required.", nameof(projectId));
        if (!Enum.IsDefined(category)) throw new ArgumentOutOfRangeException(nameof(category));
        if (!Enum.IsDefined(result)) throw new ArgumentOutOfRangeException(nameof(result));
        ProjectId = projectId;
        Category = category;
        Result = result;
        Title = Required(title, nameof(title), 180);
        Evidence = Required(evidence, nameof(evidence), 4000);
        ExecutedBy = Required(executedBy, nameof(executedBy), 120);
        ExecutedAtUtc = DateTimeOffset.UtcNow;
    }

    public Guid ProjectId { get; private set; }
    public ValidationCategory Category { get; private set; }
    public ValidationResult Result { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Evidence { get; private set; } = string.Empty;
    public string ExecutedBy { get; private set; } = string.Empty;
    public DateTimeOffset ExecutedAtUtc { get; private set; }

    private static string Required(string? value, string name, int max)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 2 || normalized.Length > max)
            throw new ArgumentException($"{name} must contain 2-{max} characters.", name);
        return normalized;
    }
}

public enum ValidationCategory { Security = 1, Performance = 2, Usability = 3, UserAcceptance = 4 }
public enum ValidationResult { Passed = 1, Failed = 2, Conditional = 3 }
