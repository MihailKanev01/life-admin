# Phase 6 — Implementation Foundation

Status: Foundation prepared

## Goal

Establish a reproducible project skeleton before implementing business features.

## Included

- Next.js web app baseline
- Spring Boot API baseline
- PostgreSQL local infrastructure
- Flyway baseline migration
- API health endpoint
- environment example
- clear separation between web and backend

## Explicitly not included

- authentication
- production business entities
- reminders
- payments
- document uploads
- AI
- household sharing

These remain blocked on product validation where appropriate.

## Local topology

Browser
→ Next.js :3000
→ Spring Boot :8080
→ PostgreSQL :5432

## Next implementation gate

Before building business entities:
- complete real-user validation;
- update MVP scope;
- update ERD if evidence changes the model;
- then implement domain modules incrementally.
