# QAssure — Phase 3: Test Runs & Execution

Phase 3 turns the test-design repository into executable QA evidence. A **Test Run** groups Ready test cases against a concrete build and environment. Each case receives one execution result and retains the observed result, notes, evidence reference, tester identity, and execution timestamp.

## Test-run workflow

`Draft → InProgress → Completed`

A run may also move to `Cancelled` before completion. Starting requires at least one execution. Completion is rejected while any execution remains `NotRun`.

## Execution outcomes

- `NotRun` — pending and therefore not final.
- `Passed` — observed result satisfies the expected result.
- `Failed` — observed behavior differs from the expected result.
- `Blocked` — execution cannot proceed because a dependency or precondition prevents it.
- `Skipped` — intentionally excluded from this cycle with an execution record.

Every final result requires an **Actual Result**. Notes and an evidence reference are optional but persist with the execution.

## ISO-410 verification evidence

| ID | Technique | Verification target | Expected |
| --- | --- | --- | --- |
| TR-BVA-01 | Boundary value | Start with 0 executions | Rejected |
| TR-BVA-02 | Boundary value | Start with 1 execution | Accepted |
| TR-ST-01 | State transition | Draft → InProgress | Accepted |
| TR-ST-02 | State transition | InProgress → Completed with 0 pending | Accepted |
| TR-ST-03 | State transition | InProgress → Completed with pending execution | Rejected |
| TR-ST-04 | State transition | Completed → Cancelled | Rejected |
| EX-EP-01 | Equivalence partition | Final result = Passed/Failed/Blocked/Skipped | Accepted |
| EX-EP-02 | Equivalence partition | Result = NotRun through result endpoint | Rejected |
| EX-VAL-01 | Input validation | Final result without Actual Result | Rejected |

These cases are automated in `TestRunTests.cs` and `TestExecutionTests.cs`.

## Decision table — completion gate

| Run status | Pending executions | Complete? |
| --- | ---: | --- |
| Draft | any | No |
| InProgress | > 0 | No |
| InProgress | 0 | Yes |
| Completed | 0 | No (already closed) |
| Cancelled | any | No |

## API surface

- `GET /api/projects/{projectId}/test-runs`
- `GET /api/projects/{projectId}/test-runs/{runId}`
- `POST /api/projects/{projectId}/test-runs`
- `POST /api/projects/{projectId}/test-runs/{runId}/start`
- `PUT /api/projects/{projectId}/test-runs/{runId}/executions/{executionId}`
- `POST /api/projects/{projectId}/test-runs/{runId}/complete`
- `POST /api/projects/{projectId}/test-runs/{runId}/cancel`

## Metrics

Each run exposes total executions, Not Run, Passed, Failed, Blocked, Skipped, and Pass Rate. This data becomes the basis for Phase 4 defect management and release-quality reporting.
