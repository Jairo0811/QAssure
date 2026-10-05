namespace QAssure.Domain.Quality;

public static class QualityGateEvaluator
{
    public static QualityGateResult Evaluate(QualityGateInput input)
    {
        var checks = new[]
        {
            new QualityGateCheck("Requirement coverage", input.RequirementCoverage >= 95, $"{input.RequirementCoverage:0.#}% / 95%"),
            new QualityGateCheck("Pass rate", input.PassRate >= 90, $"{input.PassRate:0.#}% / 90%"),
            new QualityGateCheck("Completed test run", input.CompletedRuns > 0, $"{input.CompletedRuns} completed"),
            new QualityGateCheck("Pending executions", input.PendingExecutions == 0, $"{input.PendingExecutions} pending"),
            new QualityGateCheck("Critical defects", input.OpenCriticalDefects == 0, $"{input.OpenCriticalDefects} open"),
            new QualityGateCheck("Critical risks", input.OpenCriticalRisks == 0, $"{input.OpenCriticalRisks} open"),
            new QualityGateCheck("Final validation", input.ValidationAreasPassed >= 4, $"{input.ValidationAreasPassed}/4 areas passed")
        };

        var failed = checks.Count(x => !x.Passed);
        var decision = failed == 0 ? QualityGateDecision.Ready :
            input.OpenCriticalDefects > 0 || input.PendingExecutions > 0 || input.CompletedRuns == 0
                ? QualityGateDecision.Blocked
                : QualityGateDecision.Conditional;

        return new QualityGateResult(decision, checks);
    }
}

public sealed record QualityGateInput(
    double RequirementCoverage,
    double PassRate,
    int CompletedRuns,
    int PendingExecutions,
    int OpenCriticalDefects,
    int OpenCriticalRisks,
    int ValidationAreasPassed);

public sealed record QualityGateCheck(string Name, bool Passed, string Evidence);
public sealed record QualityGateResult(QualityGateDecision Decision, IReadOnlyList<QualityGateCheck> Checks);
public enum QualityGateDecision { Ready = 1, Conditional = 2, Blocked = 3 }
