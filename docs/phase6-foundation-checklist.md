# Phase 6 — Foundation Checklist

## Source of truth

- [x] Git branch created
- [x] Web project baseline
- [x] API project baseline
- [x] PostgreSQL local infrastructure
- [x] Flyway baseline
- [x] Health endpoint
- [x] API test
- [x] Environment example
- [x] Dockerfile
- [x] GitHub CI workflow

## Verification status

### Confirmed in this environment
- Java 21 is installed.
- Architecture files are syntactically structured.
- GitHub contains all intended files.
- Vercel can build the web project on the configured Node/Next.js stack.

### Not locally runnable in this environment
- Maven is not installed.
- Docker is not installed.
- Network access to Maven Central/GitHub is restricted in the container.

Therefore the API test/build must be verified by GitHub Actions before this phase is considered implementation-complete.

## Gate

Do not add domain entities until:
1. CI passes;
2. Phase 1 user validation is complete or explicitly waived with a documented product decision;
3. ERD has been reconciled with evidence.
