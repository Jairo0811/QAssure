using QAssure.Domain.Common;

namespace QAssure.Domain.Testing;

public sealed class TestRun : Entity
{
    private TestRun() { }

    public TestRun(
        Guid projectId,
        string name,
        string buildVersion,
        QaEnvironment environment,
        TestRunType type)
    {
        if (projectId == Guid.Empty)
            throw new ArgumentException("Project is required.", nameof(projectId));
        if (!Enum.IsDefined(environment))
            throw new ArgumentOutOfRangeException(nameof(environment));
        if (!Enum.IsDefined(type))
            throw new ArgumentOutOfRangeException(nameof(type));

        ProjectId = projectId;
        Name = NormalizeRequired(name, nameof(name), 180);
        BuildVersion = NormalizeRequired(buildVersion, nameof(buildVersion), 80);
        Environment = environment;
        Type = type;
    }

    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string BuildVersion { get; private set; } = string.Empty;
    public QaEnvironment Environment { get; private set; }
    public TestRunType Type { get; private set; }
    public TestRunStatus Status { get; private set; } = TestRunStatus.Draft;
    public DateTimeOffset? StartedAtUtc { get; private set; }
    public DateTimeOffset? CompletedAtUtc { get; private set; }

    public void Start(int executionCount)
    {
        if (Status != TestRunStatus.Draft)
            throw new InvalidOperationException("Only draft test runs can be started.");
        if (executionCount <= 0)
            throw new InvalidOperationException("A test run requires at least one test case before it can start.");

        Status = TestRunStatus.InProgress;
        StartedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    public void Complete(int pendingExecutionCount)
    {
        if (Status != TestRunStatus.InProgress)
            throw new InvalidOperationException("Only test runs in progress can be completed.");
        if (pendingExecutionCount > 0)
            throw new InvalidOperationException("All test executions must have a final result before the run can be completed.");

        Status = TestRunStatus.Completed;
        CompletedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    public void Cancel()
    {
        if (Status == TestRunStatus.Completed)
            throw new InvalidOperationException("A completed test run cannot be cancelled.");
        if (Status == TestRunStatus.Cancelled)
            return;

        Status = TestRunStatus.Cancelled;
        CompletedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    private static string NormalizeRequired(string? value, string parameterName, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 2 || normalized.Length > maxLength)
            throw new ArgumentException($"{parameterName} must contain 2-{maxLength} characters.", parameterName);

        return normalized;
    }
}

public enum QaEnvironment
{
    Development = 0,
    Qa = 1,
    Staging = 2,
    ProductionLike = 3
}

public enum TestRunType
{
    Smoke = 1,
    Regression = 2,
    System = 3,
    Acceptance = 4
}

public enum TestRunStatus
{
    Draft = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}
