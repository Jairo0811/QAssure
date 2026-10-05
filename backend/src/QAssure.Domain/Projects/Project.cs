using QAssure.Domain.Common;

namespace QAssure.Domain.Projects;

public sealed class Project : Entity
{
    private Project() { }

    public Project(
        string name,
        string key,
        string description = "",
        string version = "0.1.0",
        ProjectCriticality criticality = ProjectCriticality.Medium)
    {
        Rename(name);
        SetKey(key);
        UpdateDetails(description, version, criticality);
    }

    public string Name { get; private set; } = string.Empty;
    public string Key { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Version { get; private set; } = "0.1.0";
    public ProjectCriticality Criticality { get; private set; } = ProjectCriticality.Medium;
    public ProjectStatus Status { get; private set; } = ProjectStatus.Draft;

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Project name is required.", nameof(name));

        var normalized = name.Trim();
        if (normalized.Length > 180)
            throw new ArgumentException("Project name cannot exceed 180 characters.", nameof(name));

        Name = normalized;
        MarkUpdated();
    }

    public void UpdateDetails(string description, string version, ProjectCriticality criticality)
    {
        var normalizedDescription = description?.Trim() ?? string.Empty;
        var normalizedVersion = version?.Trim() ?? string.Empty;

        if (normalizedDescription.Length > 2000)
            throw new ArgumentException("Project description cannot exceed 2000 characters.", nameof(description));
        if (normalizedVersion.Length is < 1 or > 40)
            throw new ArgumentException("Project version must contain 1-40 characters.", nameof(version));

        Description = normalizedDescription;
        Version = normalizedVersion;
        Criticality = criticality;
        MarkUpdated();
    }

    public void Activate()
    {
        if (Status is ProjectStatus.Closed)
            throw new InvalidOperationException("A closed project cannot be activated.");

        Status = ProjectStatus.Active;
        MarkUpdated();
    }

    public void Close()
    {
        Status = ProjectStatus.Closed;
        MarkUpdated();
    }

    private void SetKey(string key)
    {
        var normalized = key?.Trim().ToUpperInvariant() ?? string.Empty;

        if (normalized.Length is < 2 or > 12 || normalized.Any(c => !char.IsLetterOrDigit(c) && c != '-'))
            throw new ArgumentException("Project key must contain 2-12 letters, digits, or hyphens.", nameof(key));

        Key = normalized;
    }
}

public enum ProjectStatus
{
    Draft = 0,
    Active = 1,
    Closed = 2
}

public enum ProjectCriticality
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
