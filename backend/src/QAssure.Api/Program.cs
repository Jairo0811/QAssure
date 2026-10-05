using Microsoft.EntityFrameworkCore;
using QAssure.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddDbContext<QAssureDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("QAssure")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapGet("/", () => Results.Ok(new
{
    product = "QAssure",
    tagline = "Verify. Validate. Assure.",
    status = "foundation"
}));

app.MapHealthChecks("/health");

app.Run();

public partial class Program;
