using QAssure.Domain.Common;

namespace QAssure.Domain.Risks;

public sealed class RiskItem : Entity
{
    private RiskItem() { }

    public RiskItem(
        Guid projectId,
        Guid? requirementId,
        string code,
        string title,
        string description,
        int probability,
        int impact,
        string mitigation)
    {
        if (projectId == Guid.Empty)
            throw new ArgumentException("Project is required.", nameof(projectId));

        ProjectId = projectId;
        RequirementId = requirementId;
        SetCode(code);
        Update(title, description, probability, impact, mitigation, requirementId);
    }

    public Guid ProjectId { get; private set; }
    public Guid? RequirementId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int Probability { get; private set; }
    public int Impact { get; private set; }
    public string Mitigation { get; private set; } = string.Empty;
    public RiskStatus Status { get; private set; } = RiskStatus.Open;

    public int Score => Probability * Impact;

    public RiskLevel Level => Score switch
    {
        <= 5 => RiskLevel.Low,
        <= 10 => RiskLevel.Medium,
        <= 15 => RiskLevel.High,
        _ => RiskLevel.Critical
    };

    public void Update(
        string title,
        string description,
        int probability,
        int impact,
        string mitigation,
        Guid? requirementId)
    {
        var normalizedTitle = NormalizeRequired(title, nameof(title), 180);
        var normalizedDescription = NormalizeRequired(description, nameof(description), 4000);
        var normalizedMitigation = NormalizeRequired(mitigation, nameof(mitigation), 4000);

        ValidateScale(probability, nameof(probability));
        ValidateScale(impact, nameof(impact));

        Title = normalizedTitle;
        Description = normalizedDescription;
        Probability = probability;
        Impact = impact;
        Mitigation = normalizedMitigation;
        RequirementId = requirementId;
        MarkUpdated();
    }

    public void MarkMitigated()
    {
        Status = RiskStatus.Mitigated;
        MarkUpdated();
    }

    public void Accept()
    {
        Status = RiskStatus.Accepted;
        MarkUpdated();
    }

    public void Reopen()
    {
        Status = RiskStatus.Open;
        MarkUpdated();
    }

    private void SetCode(string code)
    {
        var normalized = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized.Length is < 2 or > 40 || normalized.Any(c => !char.IsLetterOrDigit(c) && c is not '-' and not '_'))
            throw new ArgumentException("Risk code must contain 2-40 letters, digits, hyphens, or underscores.", nameof(code));

        Code = normalized;
    }

    private static void ValidateScale(int value, string parameterName)
    {
        if (value is < 1 or > 5)
            throw new ArgumentOutOfRangeException(parameterName, "Risk probability and impact must be between 1 and 5.");
    }

    private static string NormalizeRequired(string? value, string parameterName, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 3 || normalized.Length > maxLength)
            throw new ArgumentException($"{parameterName} must contain 3-{maxLength} characters.", parameterName);

        return normalized;
    }
}

public enum RiskStatus
{
    Open = 0,
    Mitigated = 1,
    Accepted = 2
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
