using QAssure.Domain.Testing;

namespace QAssure.UnitTests;

public sealed class TestCaseTests
{
    [Fact]
    public void Constructor_NormalizesCodeAndStartsInDraft()
    {
        var testCase = CreateTestCase("tc-001");

        Assert.Equal("TC-001", testCase.Code);
        Assert.Equal(TestCaseStatus.Draft, testCase.Status);
        Assert.Equal(TestTechnique.BoundaryValueAnalysis, testCase.Technique);
    }

    [Fact]
    public void MarkReady_TransitionsFromDraftToReady()
    {
        var testCase = CreateTestCase("TC-002");

        testCase.MarkReady();

        Assert.Equal(TestCaseStatus.Ready, testCase.Status);
    }

    [Fact]
    public void DeprecatedCase_CannotReturnToReady()
    {
        var testCase = CreateTestCase("TC-003");
        testCase.Deprecate();

        Assert.Throws<InvalidOperationException>(testCase.MarkReady);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Constructor_RejectsEmptyExpectedResult(string expectedResult)
    {
        Assert.Throws<ArgumentException>(() => new TestCase(
            Guid.NewGuid(),
            null,
            null,
            "TC-004",
            "Validate project key boundary",
            TestLevel.System,
            TestType.Functional,
            TestTechnique.BoundaryValueAnalysis,
            TestPriority.High,
            "Validate the project key boundary rule.",
            "The create project form is available.",
            "Enter a boundary value and submit the form.",
            "Keys with lengths 1, 2, 12 and 13.",
            expectedResult,
            "The application remains usable."));
    }

    private static TestCase CreateTestCase(string code) => new(
        Guid.NewGuid(),
        Guid.NewGuid(),
        null,
        code,
        "Validate project key boundary",
        TestLevel.System,
        TestType.Functional,
        TestTechnique.BoundaryValueAnalysis,
        TestPriority.High,
        "Validate the project key boundary rule.",
        "The create project form is available.",
        "Enter the selected boundary value and submit the form.",
        "Keys with lengths 1, 2, 12 and 13.",
        "Only keys containing 2-12 valid characters are accepted.",
        "The application remains usable.");
}
