using QAssure.Domain.Common;

namespace QAssure.Domain.Testing;

public sealed class TestCase : Entity
{
    private TestCase() { }

    public TestCase(Guid projectId, string code, string title, TestLevel level, TestType type)
    {
        if (projectId == Guid.Empty)
            throw new ArgumentException("Project is required.", nameof(projectId));

        ProjectId = projectId;
        Code = NormalizeRequired(code, nameof(code), 40);
        Title = NormalizeRequired(title, nameof(title), 180);
        Level = level;
        Type = type;
    }

    public Guid ProjectId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public TestLevel Level { get; private set; }
    public TestType Type { get; private set; }

    private static string NormalizeRequired(string value, string parameterName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Value is required.", parameterName);

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
            throw new ArgumentOutOfRangeException(parameterName, $"Maximum length is {maxLength} characters.");

        return normalized;
    }
}

public enum TestLevel
{
    Component = 0,
    Integration = 1,
    System = 2,
    Acceptance = 3
}

public enum TestType
{
    Functional = 0,
    NonFunctional = 1
}
