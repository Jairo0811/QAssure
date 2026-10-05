using QAssure.Domain.Common;

namespace QAssure.Domain.Testing;

public sealed class TestExecution : Entity
{
    private TestExecution() { }

    public TestExecution(Guid testRunId, Guid testCaseId)
    {
        if (testRunId == Guid.Empty)
            throw new ArgumentException("Test run is required.", nameof(testRunId));
        if (testCaseId == Guid.Empty)
            throw new ArgumentException("Test case is required.", nameof(testCaseId));

        TestRunId = testRunId;
        TestCaseId = testCaseId;
    }

    public Guid TestRunId { get; private set; }
    public Guid TestCaseId { get; private set; }
    public TestExecutionResult Result { get; private set; } = TestExecutionResult.NotRun;
    public string ActualResult { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;
    public string Evidence { get; private set; } = string.Empty;
    public string ExecutedBy { get; private set; } = string.Empty;
    public DateTimeOffset? ExecutedAtUtc { get; private set; }

    public void RecordResult(
        TestExecutionResult result,
        string actualResult,
        string? notes,
        string? evidence,
        string executedBy)
    {
        if (result == TestExecutionResult.NotRun || !Enum.IsDefined(result))
            throw new ArgumentException("A final execution result is required.", nameof(result));

        ActualResult = NormalizeRequired(actualResult, nameof(actualResult), 4000);
        Notes = NormalizeOptional(notes, nameof(notes), 4000);
        Evidence = NormalizeOptional(evidence, nameof(evidence), 1000);
        ExecutedBy = NormalizeRequired(executedBy, nameof(executedBy), 120);
        Result = result;
        ExecutedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    private static string NormalizeRequired(string? value, string parameterName, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 2 || normalized.Length > maxLength)
            throw new ArgumentException($"{parameterName} must contain 2-{maxLength} characters.", parameterName);
        return normalized;
    }

    private static string NormalizeOptional(string? value, string parameterName, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length > maxLength)
            throw new ArgumentOutOfRangeException(parameterName, $"Maximum length is {maxLength} characters.");
        return normalized;
    }
}

public enum TestExecutionResult
{
    NotRun = 0,
    Passed = 1,
    Failed = 2,
    Blocked = 3,
    Skipped = 4
}
