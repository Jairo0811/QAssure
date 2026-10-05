using QAssure.Domain.Projects;

namespace QAssure.UnitTests;

public sealed class ProjectBoundaryTests
{
    [Theory]
    [InlineData("QA")]
    [InlineData("QA-410")]
    [InlineData("ABCDEFGHIJKL")]
    public void Constructor_AcceptsValidProjectKeyBoundaries(string key)
    {
        var project = new Project("QAssure", key);

        Assert.Equal(key, project.Key);
    }

    [Theory]
    [InlineData("Q")]
    [InlineData("ABCDEFGHIJKLM")]
    [InlineData("QA 410")]
    public void Constructor_RejectsInvalidProjectKeyBoundaries(string key)
    {
        Assert.Throws<ArgumentException>(() => new Project("QAssure", key));
    }

    [Fact]
    public void UpdateDetails_SetsQualityContext()
    {
        var project = new Project("QAssure", "QA");

        project.UpdateDetails("Verification and validation platform", "1.0.0", ProjectCriticality.High);

        Assert.Equal("1.0.0", project.Version);
        Assert.Equal(ProjectCriticality.High, project.Criticality);
    }
}
