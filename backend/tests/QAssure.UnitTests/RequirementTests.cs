using QAssure.Domain.Requirements;

namespace QAssure.UnitTests;

public sealed class RequirementTests
{
    [Fact]
    public void Constructor_NormalizesCodeAndStartsInDraft()
    {
        var requirement = new Requirement(
            Guid.NewGuid(),
            "req-001",
            "User can sign in",
            "The platform must authenticate registered users.",
            "A valid user receives an authenticated session.",
            RequirementType.Functional,
            RequirementPriority.High);

        Assert.Equal("REQ-001", requirement.Code);
        Assert.Equal(RequirementStatus.Draft, requirement.Status);
        Assert.Equal(RequirementPriority.High, requirement.Priority);
    }

    [Fact]
    public void Approve_ChangesStatusToApproved()
    {
        var requirement = CreateRequirement();

        requirement.Approve();

        Assert.Equal(RequirementStatus.Approved, requirement.Status);
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    [InlineData("REQ 001")]
    public void Constructor_WithInvalidCode_Throws(string code)
    {
        Assert.Throws<ArgumentException>(() => new Requirement(
            Guid.NewGuid(),
            code,
            "Valid title",
            "Valid requirement description.",
            "Valid acceptance criteria.",
            RequirementType.Functional,
            RequirementPriority.Medium));
    }

    [Fact]
    public void Constructor_WithoutProject_Throws()
    {
        Assert.Throws<ArgumentException>(() => new Requirement(
            Guid.Empty,
            "REQ-001",
            "Valid title",
            "Valid requirement description.",
            "Valid acceptance criteria.",
            RequirementType.Functional,
            RequirementPriority.Medium));
    }

    private static Requirement CreateRequirement() => new(
        Guid.NewGuid(),
        "REQ-001",
        "User can sign in",
        "The platform must authenticate registered users.",
        "A valid user receives an authenticated session.",
        RequirementType.Functional,
        RequirementPriority.Medium);
}
