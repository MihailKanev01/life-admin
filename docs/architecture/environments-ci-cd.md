# Environments, Git and CI/CD

## Branch model

- `main` — protected integration branch
- `feature/*` — feature work
- `fix/*` — bug fixes
- `phase-*/*` — product phase branches while the project is still being planned

No direct pushes to `main`.

## Pull requests

Every implementation PR should have:
- summary;
- scope;
- test evidence;
- screenshots for UI changes;
- migration notes when relevant;
- security/privacy impact when relevant.

## Environments

### Local

Docker Compose:
- PostgreSQL
- backend
- optional object storage emulator

### Staging

- separate DB
- separate object bucket
- test email destination
- seeded non-production data
- Vercel preview/staging web

### Production

- production DB
- private production bucket
- real email provider
- monitoring
- backups

## CI

On every PR:
1. frontend install/check
2. frontend build
3. backend compile
4. backend tests
5. dependency/security checks
6. artifact generation

## Deployment

Web:
GitHub → Vercel preview for branch/PR → production after merge

Backend:
GitHub → container build → staging → production after review

## Database migrations

Flyway migrations are versioned and committed.

Never modify an already-applied migration. Add a new migration.

## Observability

Minimum:
- health endpoint
- structured application logs
- request ID
- error tracking
- DB query/slow query monitoring
- uptime check

## Backups

- daily automated DB backups;
- retention policy;
- periodic restore test;
- object storage versioning/backups where supported.
