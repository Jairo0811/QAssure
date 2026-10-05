# QAssure Architecture

QAssure starts with a modular Clean Architecture structure so QA rules remain testable without depending on HTTP, SQL Server, or the UI.

## Backend layers

- **QAssure.Domain** — entities, value objects, enums, invariants, domain rules.
- **QAssure.Application** — use cases, contracts, validation, orchestration.
- **QAssure.Infrastructure** — EF Core, SQL Server, external adapters.
- **QAssure.Api** — HTTP endpoints, authentication, OpenAPI, composition root.

Dependencies point inward:

`Api → Application → Domain`

`Api → Infrastructure → Application/Domain`

## Frontend

React + TypeScript + Vite. The UI will be organized around QA workflows rather than database tables:

`Projects → Requirements → Test Cases → Test Runs → Defects → Traceability → Reports`

## Testing pyramid

- Unit tests for domain rules.
- Integration tests for persistence and API boundaries.
- API contract/smoke tests.
- Playwright E2E for critical user journeys.
- k6 for selected performance scenarios.

## First architectural rule

A release must never be considered valid only because the application compiles. Quality evidence must be traceable from requirement to execution result and, when applicable, to defect and re-test.
