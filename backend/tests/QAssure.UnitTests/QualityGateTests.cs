using QAssure.Domain.Quality;

namespace QAssure.UnitTests;

public sealed class QualityGateTests
{
    [Fact]
    public void Ready_requires_every_quality_gate()
    {
        var result = QualityGateEvaluator.Evaluate(new(95, 90, 1, 0, 0, 0, 4));
        Assert.Equal(QualityGateDecision.Ready, result.Decision);
        Assert.All(result.Checks, x => Assert.True(x.Passed));
    }

    [Theory]
    [InlineData(94.9, 90)]
    [InlineData(95, 89.9)]
    public void Coverage_and_pass_rate_boundaries_produce_conditional_gate(double coverage, double passRate)
    {
        var result = QualityGateEvaluator.Evaluate(new(coverage, passRate, 1, 0, 0, 0, 4));
        Assert.Equal(QualityGateDecision.Conditional, result.Decision);
    }

    [Fact]
    public void Critical_defect_blocks_release()
    {
        var result = QualityGateEvaluator.Evaluate(new(100, 100, 2, 0, 1, 0, 4));
        Assert.Equal(QualityGateDecision.Blocked, result.Decision);
    }

    [Fact]
    public void Pending_execution_blocks_release()
    {
        var result = QualityGateEvaluator.Evaluate(new(100, 100, 2, 1, 0, 0, 4));
        Assert.Equal(QualityGateDecision.Blocked, result.Decision);
    }
}
