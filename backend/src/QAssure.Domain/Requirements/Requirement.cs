using QAssure.Domain.Common;

namespace QAssure.Domain.Requirements;

public sealed class Requirement : Entity
{
    private Requirement() { }

    public Requirement(
        Guid projectId,
        string code,
        string title,
        string description,
        string acceptanceCriteria,
        RequirementType type,
        RequirementPriority priority)
    {
        if (projectId == Guid.Empty)
            throw new ArgumentException("Project is required.", nameof(projectId));

        ProjectId = projectId;
        SetCode(code);
        Update(title, description, acceptanceCriteria, type, priority);
    }

    public Guid ProjectId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string AcceptanceCriteria { get; private set; } = string.Empty;
    public RequirementType Type { get; private set; } = RequirementType.Functional;
    public RequirementPriority Priority { get; private set; } = RequirementPriority.Medium;
    public RequirementStatus Status { get; private set; } = RequirementStatus.Draft;

    public void Update(
        string title,
        string description,
        string acceptanceCriteria,
        RequirementType type,
        RequirementPriority priority)
    {
        var normalizedTitle = title?.Trim() ?? string.Empty;
        var normalizedDescription = description?.Trim() ?? string.Empty;
        var normalizedCriteria = acceptanceCriteria?.Trim() ?? string.Empty;

        if (normalizedTitle.Length is < 3 or > 180)
            throw new ArgumentException("Requirement title must contain 3-180 characters.", nameof(title));
        if (normalizedDescription.Length is < 3 or > 4000)
            throw new ArgumentException("Requirement description must contain 3-4000 characters.", nameof(description));
        if (normalizedCriteria.Length is < 3 or > 4000)
            throw new ArgumentException("Acceptance criteria must contain 3-4000 characters.", nameof(acceptanceCriteria));

        Title = normalizedTitle;
        Description = normalizedDescription;
        AcceptanceCriteria = normalizedCriteria;
        Type = type;
        Priority = priority;
        MarkUpdated();
    }

    public void Approve()
    {
        Status = RequirementStatus.Approved;
        MarkUpdated();
    }

    public void Reject()
    {
        Status = RequirementStatus.Rejected;
        MarkUpdated();
    }

    public void ReturnToDraft()
    {
        Status = RequirementStatus.Draft;
        MarkUpdated();
    }

    private void SetCode(string code)
    {
        var normalized = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized.Length is < 2 or > 40 || normalized.Any(c => !char.IsLetterOrDigit(c) && c is not '-' and not '_'))
            throw new ArgumentException("Requirement code must contain 2-40 letters, digits, hyphens, or underscores.", nameof(code));

        Code = normalized;
    }
}

public enum RequirementType
{
    Functional = 1,
    NonFunctional = 2
}

public enum RequirementPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum RequirementStatus
{
    Draft = 0,
    Approved = 1,
    Rejected = 2
}
