using QAssure.Domain.Common;

namespace QAssure.Domain.Defects;

public sealed class Defect : Entity
{
    private Defect() { }

    public Defect(
        Guid projectId,
        Guid executionId,
        Guid testCaseId,
        string code,
        string title,
        DefectSeverity severity,
        DefectPriority priority,
        string description,
        string reproductionSteps,
        string expectedResult,
        string actualResult)
    {
        if (projectId == Guid.Empty) throw new ArgumentException("Project is required.", nameof(projectId));
        if (executionId == Guid.Empty) throw new ArgumentException("Execution is required.", nameof(executionId));
        if (testCaseId == Guid.Empty) throw new ArgumentException("Test case is required.", nameof(testCaseId));
        if (!Enum.IsDefined(severity)) throw new ArgumentOutOfRangeException(nameof(severity));
        if (!Enum.IsDefined(priority)) throw new ArgumentOutOfRangeException(nameof(priority));

        ProjectId = projectId;
        ExecutionId = executionId;
        TestCaseId = testCaseId;
        Code = NormalizeCode(code);
        Title = Required(title, nameof(title), 180);
        Severity = severity;
        Priority = priority;
        Description = Required(description, nameof(description), 4000);
        ReproductionSteps = Required(reproductionSteps, nameof(reproductionSteps), 4000);
        ExpectedResult = Required(expectedResult, nameof(expectedResult), 4000);
        ActualResult = Required(actualResult, nameof(actualResult), 4000);
    }

    public Guid ProjectId { get; private set; }
    public Guid ExecutionId { get; private set; }
    public Guid TestCaseId { get; private set; }
    public Guid? RetestExecutionId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public DefectSeverity Severity { get; private set; }
    public DefectPriority Priority { get; private set; }
    public DefectStatus Status { get; private set; } = DefectStatus.New;
    public string Description { get; private set; } = string.Empty;
    public string ReproductionSteps { get; private set; } = string.Empty;
    public string ExpectedResult { get; private set; } = string.Empty;
    public string ActualResult { get; private set; } = string.Empty;
    public string AssignedTo { get; private set; } = string.Empty;
    public string Resolution { get; private set; } = string.Empty;

    public void StartWork(string assignedTo)
    {
        if (Status is DefectStatus.Closed or DefectStatus.Resolved)
            throw new InvalidOperationException("Resolved or closed defects cannot start work without being reopened.");
        AssignedTo = Required(assignedTo, nameof(assignedTo), 120);
        Status = DefectStatus.InProgress;
        MarkUpdated();
    }

    public void Resolve(string resolution)
    {
        if (Status == DefectStatus.Closed)
            throw new InvalidOperationException("A closed defect cannot be resolved again.");
        Resolution = Required(resolution, nameof(resolution), 4000);
        Status = DefectStatus.Resolved;
        MarkUpdated();
    }

    public void VerifyRetest(Guid retestExecutionId, bool passed)
    {
        if (Status != DefectStatus.Resolved)
            throw new InvalidOperationException("Only resolved defects can be verified by re-test.");
        if (retestExecutionId == Guid.Empty)
            throw new ArgumentException("Re-test execution is required.", nameof(retestExecutionId));

        RetestExecutionId = retestExecutionId;
        Status = passed ? DefectStatus.Closed : DefectStatus.Reopened;
        MarkUpdated();
    }

    private static string NormalizeCode(string? value)
    {
        var normalized = value?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized.Length is < 2 or > 40 || normalized.Any(c => !char.IsLetterOrDigit(c) && c is not '-' and not '_'))
            throw new ArgumentException("Defect code must contain 2-40 letters, digits, hyphens, or underscores.", nameof(value));
        return normalized;
    }

    private static string Required(string? value, string name, int max)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 2 || normalized.Length > max)
            throw new ArgumentException($"{name} must contain 2-{max} characters.", name);
        return normalized;
    }
}

public enum DefectSeverity { Low = 1, Medium = 2, High = 3, Critical = 4 }
public enum DefectPriority { Low = 1, Medium = 2, High = 3, Critical = 4 }
public enum DefectStatus { New = 0, InProgress = 1, Resolved = 2, Closed = 3, Reopened = 4 }
