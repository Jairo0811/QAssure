# QAssure

**Software Quality Assurance Platform**

> Verify. Validate. Assure.

QAssure is a software quality assurance platform created for **ISO-410 — Verificación y Validación de Software** at Universidad APEC. It centralizes requirements, risks, test cases, test executions, defects, traceability, quality metrics, and validation evidence in one workflow.

## Quality workflow

`Requirements → Risks → Test Cases → Test Runs → Defects → Re-test → Regression → Validation → Quality Report`

## Stack

- **Backend:** ASP.NET Core 10 Web API
- **Data:** Entity Framework Core 10 + SQL Server
- **Frontend:** React 19 + TypeScript + Vite
- **Authentication:** JWT Bearer + role-based authorization
- **Unit testing:** xUnit
- **E2E:** Playwright (planned)
- **API testing:** Postman/Newman (planned)
- **Performance:** k6
- **CI:** GitHub Actions

## Current implementation

### Foundation

- Clean Architecture solution structure.
- SQL Server local environment with Docker Compose.
- Health endpoint and OpenAPI foundation.
- GitHub Actions backend/frontend CI.
- QA-themed QAssure web shell.

### Phase 1 — Authentication, Projects & Requirements

- JWT authentication.
- Roles: Admin, QA Lead, Tester, Developer, Stakeholder.
- QA project creation and management.
- Requirement creation, editing and approval.
- Functional/non-functional requirements.
- Acceptance criteria and project criticality.
- Real frontend workspace connected to the API.
- Boundary-value unit tests for project keys and requirement rules.

See [`docs/PHASE-1.md`](docs/PHASE-1.md) for the endpoints, roles and ISO-410 test scenarios.

## Core modules roadmap

1. ✅ Authentication & Roles
2. ✅ Projects
3. ✅ Requirements
4. ⏳ Risk Analysis
5. ⏳ Test Cases
6. ⏳ Test Runs
7. ⏳ Defects
8. ⏳ Traceability Matrix
9. ⏳ Quality Dashboard
10. ⏳ Reports

## Local development

```bash
# SQL Server
docker compose up -d

# Backend
cd backend/src/QAssure.Api
dotnet run

# Frontend
cd frontend/qassure-web
npm install
npm run dev
```

The frontend uses `http://localhost:5000` as its default API URL. Copy `.env.example` to `.env` when a different API URL is needed.

### Development admin

- **Email:** `admin@qassure.local`
- **Password:** `QAssure.Local123!`

These credentials and the JWT key are for local development only.

## QA philosophy

QAssure is intentionally built as a system that can be verified and validated using the same techniques it manages: equivalence partitioning, boundary value analysis, decision tables, state transitions, use-case testing, regression, performance, security, usability, and user acceptance testing.
