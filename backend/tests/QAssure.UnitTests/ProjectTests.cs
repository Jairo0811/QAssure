using QAssure.Domain.Projects;

namespace QAssure.UnitTests;

public sealed class ProjectTests
{
    [Fact]
    public void Constructor_NormalizesProjectKey()
    {
        var project = new Project("QAssure", "qa-410");

        Assert.Equal("QA-410", project.Key);
        Assert.Equal(ProjectStatus.Draft, project.Status);
    }

    [Fact]
    public void Activate_AfterClose_Throws()
    {
        var project = new Project("QAssure", "QA");
        project.Close();

        Assert.Throws<InvalidOperationException>(project.Activate);
    }
}
