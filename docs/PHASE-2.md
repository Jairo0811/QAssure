# QAssure — Phase 2

## Risk Analysis + Test Case Design

Phase 2 extends the traceability chain introduced in Phase 1:

`Project → Requirement → Risk → Test Case → Test Run → Defect → Validation`

The implemented scope focuses on **risk-based testing** and formal **test-case design**, both central to verification and validation work in ISO-410.

## Risk analysis

Each risk belongs to a QA project and can optionally trace to a requirement. QAssure records:

- Risk code and title
- Description
- Probability from **1 to 5**
- Impact from **1 to 5**
- Risk score: `Probability × Impact`
- Derived level
- Mitigation strategy
- Lifecycle state: `Open`, `Mitigated`, `Accepted`

### Risk-level decision rule

| Score | Level |
| ---: | --- |
| 1–5 | Low |
| 6–10 | Medium |
| 11–15 | High |
| 16–25 | Critical |

This rule gives Phase 2 direct evidence for **boundary value analysis**, **equivalence partitioning**, and **decision-table reasoning**.

## Test-case design

A test case can trace to both a requirement and a risk. It stores:

- Code and title
- Test level: Component, Integration, System, Acceptance
- Test type: Functional or Non-functional
- Priority
- Test-design technique
- Objective
- Preconditions
- Steps
- Test data
- Expected result
- Postconditions
- Lifecycle state: `Draft`, `Ready`, `Deprecated`

### Supported test techniques

1. Equivalence Partitioning
2. Boundary Value Analysis
3. Decision Table
4. State Transition
5. Use Case
6. Statement Coverage
7. Decision Coverage
8. Exploratory
9. Error Guessing

## Verification evidence

The unit suite covers:

- Probability/impact boundaries: invalid values below 1 and above 5
- Risk-score partitions and threshold transitions at 5/6, 10/11 and 15/16
- Risk lifecycle transition to `Mitigated`
- Test-case code normalization
- Test-case `Draft → Ready` transition
- Rejection of incomplete expected-result data
- Rejection of invalid transition from `Deprecated → Ready`

## API surface

### Risks

- `GET /api/projects/{projectId}/risks`
- `POST /api/projects/{projectId}/risks`
- `PUT /api/projects/{projectId}/risks/{id}`
- `POST /api/projects/{projectId}/risks/{id}/mitigate`
- `POST /api/projects/{projectId}/risks/{id}/accept`

### Test cases

- `GET /api/projects/{projectId}/test-cases`
- `POST /api/projects/{projectId}/test-cases`
- `PUT /api/projects/{projectId}/test-cases/{id}`
- `POST /api/projects/{projectId}/test-cases/{id}/ready`
- `POST /api/projects/{projectId}/test-cases/{id}/draft`

## Local database note

The project currently uses `EnsureCreated` during development rather than EF Core migrations. If an existing local QAssure database was created before Phase 2, recreate the local development database once so the new `Risks` table and expanded `TestCases` schema are generated.

## Definition of done

Phase 2 is complete when:

- backend restore/build/tests pass;
- frontend TypeScript/Vite build passes;
- risk analysis is usable from the UI;
- test cases can be traced to requirements and risks;
- risk and test-case state transitions are covered by automated tests.
