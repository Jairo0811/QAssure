using QAssure.Domain.Testing;

namespace QAssure.UnitTests;

public sealed class TestExecutionTests
{
    [Fact]
    public void New_execution_starts_as_not_run()
    {
        var execution = CreateExecution();

        Assert.Equal(TestExecutionResult.NotRun, execution.Result);
        Assert.Null(execution.ExecutedAtUtc);
    }

    [Fact]
    public void Passed_result_records_execution_evidence()
    {
        var execution = CreateExecution();

        execution.RecordResult(
            TestExecutionResult.Passed,
            "Observed result matches the expected behavior.",
            "Executed with the approved QA data set.",
            "EV-001",
            "QA Tester");

        Assert.Equal(TestExecutionResult.Passed, execution.Result);
        Assert.Equal("QA Tester", execution.ExecutedBy);
        Assert.NotNull(execution.ExecutedAtUtc);
    }

    [Fact]
    public void Not_run_is_not_a_final_recordable_result()
    {
        var execution = CreateExecution();

        Assert.Throws<ArgumentException>(() => execution.RecordResult(
            TestExecutionResult.NotRun,
            "Pending execution",
            null,
            null,
            "QA Tester"));
    }

    [Fact]
    public void Final_result_requires_an_actual_result()
    {
        var execution = CreateExecution();

        Assert.Throws<ArgumentException>(() => execution.RecordResult(
            TestExecutionResult.Failed,
            "",
            "Failure reproduced.",
            "Screenshot-1",
            "QA Tester"));
    }

    private static TestExecution CreateExecution() => new(Guid.NewGuid(), Guid.NewGuid());
}
