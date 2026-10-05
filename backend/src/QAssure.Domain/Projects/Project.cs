using QAssure.Domain.Common;

namespace QAssure.Domain.Projects;

public sealed class Project : Entity
{
    private Project() { }

    public Project(string name, string key)
    {
        Rename(name);
        SetKey(key);
    }

    public string Name { get; private set; } = string.Empty;
    public string Key { get; private set; } = string.Empty;
    public ProjectStatus Status { get; private set; } = ProjectStatus.Draft;

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Project name is required.", nameof(name));

        Name = name.Trim();
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
