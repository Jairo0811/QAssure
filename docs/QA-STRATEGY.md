# QAssure QA Strategy

## Objective

Use QAssure itself as the system under test while the platform manages the evidence produced by its verification and validation process.

## Test levels

1. Component / unit
2. Integration
3. System
4. Acceptance

## Techniques planned

- Equivalence partitioning
- Boundary value analysis
- Decision tables
- State-transition testing
- Use-case testing
- Statement/decision coverage where applicable
- Error guessing
- Exploratory testing
- Checklist-based testing

## Non-functional coverage

- Performance and load
- Security
- Usability
- Accessibility
- Reliability of critical QA workflows

## Traceability target

Every critical requirement should have at least one linked test case. Every failed execution should be explainable through execution evidence and, when a product defect exists, a linked defect record.

## Initial quality gates

- Backend restore/build succeeds.
- Unit tests succeed.
- Frontend install/build succeeds.
- No critical test workflow is merged without automated regression coverage once that workflow exists.
- Main branch should remain releasable.
