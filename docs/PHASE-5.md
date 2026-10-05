# Phase 5 — Traceability Matrix & Coverage

The traceability endpoint provides bidirectional QA evidence across the complete chain:

`Requirement ↔ Risk ↔ Test Case ↔ Execution ↔ Defect`

For every requirement QAssure reports linked risks, test cases, execution totals, Passed/Failed counts, and open defects. Summary indicators include requirement coverage and execution coverage.

## Coverage formulas

- Requirement Coverage = requirements with at least one linked test case / total requirements × 100.
- Execution Coverage = executions with a final result / total scheduled executions × 100.

The matrix exposes uncovered requirements directly instead of hiding them behind aggregate percentages.
