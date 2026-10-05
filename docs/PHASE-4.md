# Phase 4 — Defect Management, Re-test & Regression

QAssure closes the defect feedback loop from a failed or blocked execution to correction verification.

## Flow

`Failed/Blocked execution → Defect → In Progress → Resolved → Re-test → Closed/Reopened`

A defect can only originate from a final Failed or Blocked execution. Re-test verification must use another final execution of the same test case. A Passed re-test closes the defect; any other final result reopens it.

## V&V evidence

- Equivalence partitioning: eligible execution results (Failed/Blocked) vs non-eligible results.
- State transitions: New → InProgress → Resolved → Closed/Reopened.
- Negative transition: a New defect cannot be re-test verified.
- Traceability: defect retains Project, original Execution, Test Case, and optional Re-test Execution identifiers.
- Regression support: re-executed test cases remain in normal Test Runs and therefore contribute to regression metrics.
