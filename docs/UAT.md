# QAssure — User Acceptance Test Scenarios

These scenarios validate the end-to-end purpose of QAssure rather than isolated implementation details.

| UAT | Scenario | Expected acceptance outcome |
|---|---|---|
| UAT-01 | Create project and requirement | Requirement is project-scoped and can be approved by authorized role |
| UAT-02 | Register risk and design test | Risk score/level is calculated and test case traces to requirement/risk |
| UAT-03 | Execute test run | Ready cases are scheduled, executed and cycle closes only with final results |
| UAT-04 | Manage failed test | Failed/Blocked execution creates a traceable defect |
| UAT-05 | Resolve and re-test defect | Successful re-test closes defect; failed re-test reopens it |
| UAT-06 | Inspect traceability | Requirement row shows linked risks, cases, executions and defects |
| UAT-07 | Review quality report | Metrics and release gate reflect actual project evidence |
| UAT-08 | Final validation | Security, Performance, Usability and UAT evidence are recordable and influence release readiness |

For every scenario capture tester, build/version, environment, date, steps, expected result, actual result, evidence reference and Pass/Fail decision.
