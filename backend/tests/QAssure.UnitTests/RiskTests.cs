using QAssure.Domain.Risks;

namespace QAssure.UnitTests;

public sealed class RiskTests
{
    [Theory]
    [InlineData(1, 1, 1, RiskLevel.Low)]
    [InlineData(1, 5, 5, RiskLevel.Low)]
    [InlineData(2, 3, 6, RiskLevel.Medium)]
    [InlineData(2, 5, 10, RiskLevel.Medium)]
    [InlineData(3, 5, 15, RiskLevel.High)]
    [InlineData(4, 4, 16, RiskLevel.Critical)]
    [InlineData(5, 5, 25, RiskLevel.Critical)]
    public void Score_ClassifiesRiskLevel(int probability, int impact, int score, RiskLevel expectedLevel)
    {
        var risk = CreateRisk(probability, impact);

        Assert.Equal(score, risk.Score);
        Assert.Equal(expectedLevel, risk.Level);
    }

    [Theory]
    [InlineData(0, 3)]
    [InlineData(6, 3)]
    [InlineData(3, 0)]
    [InlineData(3, 6)]
    public void Constructor_RejectsValuesOutsideOneToFive(int probability, int impact)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => CreateRisk(probability, impact));
    }

    [Fact]
    public void MarkMitigated_ChangesLifecycleState()
    {
        var risk = CreateRisk(4, 5);

        risk.MarkMitigated();

        Assert.Equal(RiskStatus.Mitigated, risk.Status);
    }

    private static RiskItem CreateRisk(int probability, int impact) => new(
        Guid.NewGuid(),
        null,
        "RSK-001",
        "Concurrent reservation conflict",
        "Two users may attempt the same operation at the same time.",
        probability,
        impact,
        "Protect the operation with transactional concurrency controls.");
}
