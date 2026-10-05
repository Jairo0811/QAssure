using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QAssure.Api.Endpoints;
using QAssure.Api.Infrastructure;
using QAssure.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key configuration is missing.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "QAssure.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "QAssure.Web";

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddDbContext<QAssureDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("QAssure")));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("QaLeadOrAdmin", policy => policy.RequireRole("Admin", "QaLead"))
    .AddPolicy("QaTeam", policy => policy.RequireRole("Admin", "QaLead", "Tester"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy => policy
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    product = "QAssure",
    tagline = "Verify. Validate. Assure.",
    status = "phase-2"
}));

app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapProjectsEndpoints();
app.MapRequirementsEndpoints();
app.MapRisksEndpoints();
app.MapTestCasesEndpoints();

await DatabaseBootstrap.InitialiseAsync(app);
await app.RunAsync();

public partial class Program;
