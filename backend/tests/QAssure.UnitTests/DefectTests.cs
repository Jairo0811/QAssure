using QAssure.Domain.Defects;

namespace QAssure.UnitTests;

public sealed class DefectTests
{
    private static Defect Create() => new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "def-001", "Login fails", DefectSeverity.High, DefectPriority.High, "Login returns an error.", "Open login and submit valid credentials.", "User enters the workspace.", "Server error is displayed.");

    [Fact]
    public void Code_is_normalized_and_new_is_initial_status()
    {
        var defect = Create();
        Assert.Equal("DEF-001", defect.Code);
        Assert.Equal(DefectStatus.New, defect.Status);
    }

    [Fact]
    public void Resolved_defect_closes_after_successful_retest()
    {
        var defect = Create();
        defect.StartWork("Developer");
        defect.Resolve("Fixed null guard and added regression test.");
        defect.VerifyRetest(Guid.NewGuid(), true);
        Assert.Equal(DefectStatus.Closed, defect.Status);
    }

    [Fact]
    public void Resolved_defect_reopens_after_failed_retest()
    {
        var defect = Create();
        defect.Resolve("Candidate fix deployed.");
        defect.VerifyRetest(Guid.NewGuid(), false);
        Assert.Equal(DefectStatus.Reopened, defect.Status);
    }

    [Fact]
    public void New_defect_cannot_be_verified_without_resolution()
    {
        var defect = Create();
        Assert.Throws<InvalidOperationException>(() => defect.VerifyRetest(Guid.NewGuid(), true));
    }
}
