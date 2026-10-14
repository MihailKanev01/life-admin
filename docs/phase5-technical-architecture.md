# Phase 5 — Technical Architecture

Status: Architecture baseline

## Goal

Build a web-first product with a stable backend/API that can later power native mobile clients without replacing the core domain model.

## Chosen stack

### Web
- Next.js 16.4
- React 19.3
- TypeScript
- App Router
- CSS/design tokens first; component library only where it reduces duplication

### Backend
- Java 21 LTS
- Spring Boot 4.1.1
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway database migrations

### Infrastructure
- Vercel for web
- EU-region managed PostgreSQL
- EU-region S3-compatible object storage for documents
- Managed email provider
- Scheduled background processing in Spring
- Docker Compose for local development

## Architecture shape

Browser
→ Next.js web application
→ API boundary
→ Spring Boot
→ PostgreSQL / Object Storage

The mobile application will use the same API later.

## Why this shape

The business domain contains users, households, things, reminders, payments, documents and notifications. Keeping domain logic in Spring Boot makes it reusable by web and future mobile clients.

Next.js remains focused on web UX, routing and presentation. Next.js is currently supported as Active LTS in the 16.x line, and version 16.4 is the current release as of 2026-10-07. Source: https://nextjs.org/blog and https://nextjs.org/support-policy

Spring Boot 4.1.1 is currently listed as stable. Source: https://docs.spring.io/spring-boot/

## Request flow

### Normal read

Browser
→ Next.js
→ API
→ Spring service
→ repository
→ PostgreSQL

### Document access

Browser
→ API asks for authorized document
→ backend creates short-lived signed object URL
→ browser downloads/opens object directly

The raw storage bucket is never public.

### Reminder creation

Browser
→ API
→ validate + authorize
→ persist reminder
→ schedule next notification

### AI extraction

Browser
→ secure upload
→ private storage
→ extraction worker
→ structured proposal
→ user confirmation
→ save canonical data

AI must never silently modify critical data.

## Core domain modules

- Identity
- Household
- Things
- Reminders
- Payments
- Documents
- Search
- Notifications
- Audit
- Integrations (later)

Keep domain services separated so later integrations do not leak into core business logic.

## API style

REST JSON API with versioned prefix:

/api/v1/...

Use resource-oriented routes and stable DTOs. Do not expose JPA entities directly.

## Environments

- local
- staging
- production

Local services use Docker Compose.
Staging is connected to a separate database/storage.
Production data is never used for local development.

## Non-functional requirements

### Security
- secure authentication/session handling
- authorization at every resource boundary
- rate limiting
- CSRF protection where cookie-authenticated state-changing requests are used
- secure file upload
- audit events for sensitive actions

### Privacy
- collect only required data
- private documents
- explicit sharing boundaries
- export and delete flows
- configurable retention for operational data

### Reliability
- idempotent write operations where practical
- database migrations
- backups
- health endpoints
- structured logging
- error tracking

### Performance
- server-rendered initial web content where appropriate
- cached/static content where safe
- pagination on collections
- database indexes on lookup fields
- avoid N+1 ORM queries

## Architectural constraint

The frontend must not become the source of truth for business rules. Important validation and authorization belongs in the backend.
