using QAssure.Domain.Testing;

namespace QAssure.UnitTests;

public sealed class TestRunTests
{
    [Fact]
    public void Start_requires_at_least_one_execution()
    {
        var run = CreateRun();

        var action = () => run.Start(0);

        Assert.Throws<InvalidOperationException>(action);
        Assert.Equal(TestRunStatus.Draft, run.Status);
    }

    [Fact]
    public void Draft_run_can_start_and_complete_when_no_execution_is_pending()
    {
        var run = CreateRun();

        run.Start(3);
        run.Complete(0);

        Assert.Equal(TestRunStatus.Completed, run.Status);
        Assert.NotNull(run.StartedAtUtc);
        Assert.NotNull(run.CompletedAtUtc);
    }

    [Fact]
    public void Complete_rejects_pending_executions()
    {
        var run = CreateRun();
        run.Start(2);

        var action = () => run.Complete(1);

        Assert.Throws<InvalidOperationException>(action);
        Assert.Equal(TestRunStatus.InProgress, run.Status);
    }

    [Fact]
    public void Run_cannot_be_started_twice()
    {
        var run = CreateRun();
        run.Start(1);

        Assert.Throws<InvalidOperationException>(() => run.Start(1));
    }

    [Fact]
    public void Completed_run_cannot_be_cancelled()
    {
        var run = CreateRun();
        run.Start(1);
        run.Complete(0);

        Assert.Throws<InvalidOperationException>(() => run.Cancel());
    }

    private static TestRun CreateRun() => new(
        Guid.NewGuid(),
        "Regression cycle 1",
        "1.2.0-rc1",
        QaEnvironment.Qa,
        TestRunType.Regression);
}
