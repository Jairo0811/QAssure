# QAssure — Final Validation Checklist

Phase 7 does **not** auto-mark the product as validated. Evidence must be executed and recorded in QAssure. This checklist defines the four mandatory validation areas used by the release quality gate.

## Security

- Authenticate with valid and invalid credentials.
- Confirm anonymous access is denied for protected API groups.
- Confirm Stakeholder/Developer cannot perform QA Lead-only mutations.
- Confirm JWT issuer, audience, lifetime and signature are validated.
- Confirm passwords are stored as salted PBKDF2 hashes, not plaintext.
- Exercise invalid IDs, out-of-range enums, duplicate codes and oversized input.
- Review committed files for secrets and production credentials.
- Review dependencies for known high/critical vulnerabilities.

## Performance

Run:

```bash
k6 run tests/performance/smoke.js
```

Default acceptance thresholds:

- HTTP request failure rate < 1%.
- p95 response time < 500 ms for the health smoke workload.
- No unexpected API errors during representative dashboard/report queries.

## Usability

Evaluate the main workflow using Nielsen's ten heuristics. Record findings by severity and confirm that critical usability issues are either corrected or accepted with rationale. See `docs/USABILITY-HEURISTICS.md`.

## User Acceptance Testing

Execute the representative UAT scenarios in `docs/UAT.md`. The acceptance evidence should identify tester, date, build, expected outcome, actual outcome and final acceptance decision.

## Recording evidence

Open **Final Validation** in QAssure and record one or more evidence items for Security, Performance, Usability and User Acceptance. The Phase 6 quality gate only becomes `Ready` when all four areas have at least one Passed evidence record and the other quantitative thresholds are satisfied.
