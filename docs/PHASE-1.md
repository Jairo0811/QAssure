# Phase 1 — Authentication, Projects & Requirements

Phase 1 introduces the first usable vertical slice of QAssure.

## Scope

### Authentication and authorization

- JWT Bearer authentication.
- PBKDF2 password hashing with per-user salt.
- Role model: `Admin`, `QaLead`, `Tester`, `Developer`, `Stakeholder`.
- Authorization policies:
  - `QaLeadOrAdmin`: project administration and requirement approval.
  - `QaTeam`: requirement creation and editing.
- Development bootstrap administrator for the local environment.

### QA Projects

A QA Project establishes the quality context for a software product or release.

Fields:

- Name.
- Unique project key (2–12 characters).
- Description.
- Version.
- Criticality: Low, Medium, High, Critical.
- Status: Draft, Active, Closed.

### Requirements

Every requirement belongs to a QA Project and is identified by a unique code inside that project.

Fields:

- Code.
- Title.
- Description.
- Acceptance criteria.
- Type: Functional / Non-functional.
- Priority: Low / Medium / High / Critical.
- Status: Draft / Approved / Rejected.

The acceptance criteria are intentionally first-class data because later phases will establish traceability from requirements to test cases, executions, defects, and validation evidence.

## API surface

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Anonymous | Authenticate and issue JWT |
| GET | `/api/auth/me` | Authenticated | Read current identity |
| GET | `/api/projects` | Authenticated | List projects |
| GET | `/api/projects/{id}` | Authenticated | Read project |
| POST | `/api/projects` | Admin / QA Lead | Create project |
| PUT | `/api/projects/{id}` | Admin / QA Lead | Update project |
| POST | `/api/projects/{id}/activate` | Admin / QA Lead | Activate project |
| GET | `/api/projects/{projectId}/requirements` | Authenticated | List requirements |
| POST | `/api/projects/{projectId}/requirements` | QA team | Create requirement |
| PUT | `/api/projects/{projectId}/requirements/{id}` | QA team | Update requirement |
| POST | `/api/projects/{projectId}/requirements/{id}/approve` | Admin / QA Lead | Approve requirement |

## QA evidence for ISO-410

Phase 1 deliberately creates testable boundaries and state transitions.

| ID | Technique | Test condition | Expected result |
| --- | --- | --- | --- |
| AUTH-001 | Use case | Correct email + password | JWT session is returned |
| AUTH-002 | Error guessing | Incorrect password | HTTP 401 |
| PROJ-001 | Boundary value | Project key length = 2 | Accepted |
| PROJ-002 | Boundary value | Project key length = 12 | Accepted |
| PROJ-003 | Boundary value | Project key length = 1 or 13 | Rejected |
| PROJ-004 | Equivalence partitioning | Key contains invalid whitespace | Rejected |
| REQ-001 | Equivalence partitioning | Valid requirement data | Requirement created in Draft |
| REQ-002 | Boundary value | Requirement code length = 2 | Accepted |
| REQ-003 | State transition | Draft → Approved | Status becomes Approved |
| REQ-004 | Integration | Requirement references unknown project | HTTP 404 |
| SEC-001 | Authorization | Tester attempts project creation | HTTP 403 |
| SEC-002 | Authorization | QA Lead approves requirement | Approved |

These scenarios will be automated incrementally as the API integration-test project is introduced.

## Local development

1. Start SQL Server using `docker compose up -d`.
2. Start the API from `backend/src/QAssure.Api`.
3. Start the frontend from `frontend/qassure-web`.
4. The frontend expects the API at `http://localhost:5000` by default. Override with `VITE_API_BASE_URL` if required.

Development bootstrap account:

- Email: `admin@qassure.local`
- Password: `QAssure.Local123!`

The bootstrap password and JWT signing key are development-only values and must be replaced by environment configuration before any real deployment.
