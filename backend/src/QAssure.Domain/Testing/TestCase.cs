using QAssure.Domain.Common;

namespace QAssure.Domain.Testing;

public sealed class TestCase : Entity
{
    private TestCase() { }

    public TestCase(Guid projectId, string code, string title, TestLevel level, TestType type)
        : this(
            projectId,
            null,
            null,
            code,
            title,
            level,
            type,
            TestTechnique.UseCase,
            TestPriority.Medium,
            "Validate the expected behavior.",
            "Required test context is available.",
            "Execute the documented test flow.",
            "Use representative test data.",
            "The expected behavior is observed.",
            "The system remains in a valid state.")
    {
    }

    public TestCase(
        Guid projectId,
        Guid? requirementId,
        Guid? riskId,
        string code,
        string title,
        TestLevel level,
        TestType type,
        TestTechnique technique,
        TestPriority priority,
        string objective,
        string preconditions,
        string steps,
        string testData,
        string expectedResult,
        string postconditions)
    {
        if (projectId == Guid.Empty)
            throw new ArgumentException("Project is required.", nameof(projectId));

        ProjectId = projectId;
        SetCode(code);
        UpdateDesign(
            title,
            level,
            type,
            technique,
            priority,
            objective,
            preconditions,
            steps,
            testData,
            expectedResult,
            postconditions,
            requirementId,
            riskId);
    }

    public Guid ProjectId { get; private set; }
    public Guid? RequirementId { get; private set; }
    public Guid? RiskId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public TestLevel Level { get; private set; }
    public TestType Type { get; private set; }
    public TestTechnique Technique { get; private set; }
    public TestPriority Priority { get; private set; }
    public TestCaseStatus Status { get; private set; } = TestCaseStatus.Draft;
    public string Objective { get; private set; } = string.Empty;
    public string Preconditions { get; private set; } = string.Empty;
    public string Steps { get; private set; } = string.Empty;
    public string TestData { get; private set; } = string.Empty;
    public string ExpectedResult { get; private set; } = string.Empty;
    public string Postconditions { get; private set; } = string.Empty;

    public void UpdateDesign(
        string title,
        TestLevel level,
        TestType type,
        TestTechnique technique,
        TestPriority priority,
        string objective,
        string preconditions,
        string steps,
        string testData,
        string expectedResult,
        string postconditions,
        Guid? requirementId,
        Guid? riskId)
    {
        Title = NormalizeRequired(title, nameof(title), 180);
        Objective = NormalizeRequired(objective, nameof(objective), 2000);
        Preconditions = NormalizeRequired(preconditions, nameof(preconditions), 4000);
        Steps = NormalizeRequired(steps, nameof(steps), 4000);
        TestData = NormalizeRequired(testData, nameof(testData), 4000);
        ExpectedResult = NormalizeRequired(expectedResult, nameof(expectedResult), 4000);
        Postconditions = NormalizeRequired(postconditions, nameof(postconditions), 4000);
        Level = level;
        Type = type;
        Technique = technique;
        Priority = priority;
        RequirementId = requirementId;
        RiskId = riskId;
        MarkUpdated();
    }

    public void MarkReady()
    {
        if (Status == TestCaseStatus.Deprecated)
            throw new InvalidOperationException("A deprecated test case cannot be marked ready.");

        Status = TestCaseStatus.Ready;
        MarkUpdated();
    }

    public void ReturnToDraft()
    {
        if (Status == TestCaseStatus.Deprecated)
            throw new InvalidOperationException("A deprecated test case cannot return to draft.");

        Status = TestCaseStatus.Draft;
        MarkUpdated();
    }

    public void Deprecate()
    {
        Status = TestCaseStatus.Deprecated;
        MarkUpdated();
    }

    private void SetCode(string code)
    {
        var normalized = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized.Length is < 2 or > 40 || normalized.Any(c => !char.IsLetterOrDigit(c) && c is not '-' and not '_'))
            throw new ArgumentException("Test case code must contain 2-40 letters, digits, hyphens, or underscores.", nameof(code));

        Code = normalized;
    }

    private static string NormalizeRequired(string? value, string parameterName, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 3 || normalized.Length > maxLength)
            throw new ArgumentException($"{parameterName} must contain 3-{maxLength} characters.", parameterName);

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

public enum TestTechnique
{
    EquivalencePartitioning = 1,
    BoundaryValueAnalysis = 2,
    DecisionTable = 3,
    StateTransition = 4,
    UseCase = 5,
    StatementCoverage = 6,
    DecisionCoverage = 7,
    Exploratory = 8,
    ErrorGuessing = 9
}

public enum TestPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum TestCaseStatus
{
    Draft = 0,
    Ready = 1,
    Deprecated = 2
}
