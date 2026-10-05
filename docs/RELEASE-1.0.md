# QAssure 1.0 — Release Candidate

**Product:** QAssure — Software Quality Assurance Platform  
**Tagline:** Verify. Validate. Assure.

## Functional scope

1. Authentication, roles, projects and requirements.
2. Risk analysis and formal test-case design.
3. Test runs and execution evidence.
4. Defect management, re-test and regression loop.
5. Requirement-to-defect traceability matrix and coverage.
6. Quality metrics and release gates.
7. Security, performance, usability and UAT validation evidence.

## Definition of Done

The release is eligible for `Ready` only when the automated quality gate returns Ready. A project may remain Conditional or Blocked until its actual test evidence satisfies the gate; the application does not fabricate green status.

## Database note

The current academic bootstrap still uses `EnsureCreated`. Existing local databases from previous phases must be recreated once after pulling this release so the new Defects and ValidationEvidences tables are created. A production evolution should replace this with EF Core migrations.
