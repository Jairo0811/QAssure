# QAssure — Security Validation

## Authentication and session

- JWT Bearer authentication is required for project QA endpoints.
- Token validation checks issuer, audience, lifetime and signing key.
- Local development passwords are verified against salted PBKDF2 hashes.

## Authorization

- `QaTeam`: Admin, QA Lead and Tester.
- `QaLeadOrAdmin`: Admin and QA Lead.
- Defect resolution, risk acceptance and final validation evidence use restricted policies where appropriate.

## Abuse and validation cases

Test invalid/empty GUIDs, cross-project IDs, duplicate business codes, out-of-range enum values, oversized strings, illegal lifecycle transitions and unauthorized role attempts. Expected behavior is 400/401/403/404/409 as appropriate, never silent data mutation.

## Secret hygiene

Development credentials and JWT keys are for local use only. Production deployment must inject secrets through a secret store/environment configuration and must not reuse repository defaults.
