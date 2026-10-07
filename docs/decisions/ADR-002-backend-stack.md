# ADR-002 — Backend Stack

## Status
Accepted

## Decision

Use Java 21 + Spring Boot 4.1.1 + Spring Security + Spring Data JPA + PostgreSQL + Flyway for the production backend.

## Why

- matches the developer's existing Java/Spring experience;
- strong security and operational ecosystem;
- well suited to a relational domain;
- easy REST API for web and future mobile;
- mature testing and observability patterns.

## Alternative considered

Node.js/NestJS

Rejected for this project because the user already has Java/Spring experience and the backend domain benefits from explicit layered/domain boundaries.

## Constraint

Keep the API independent of the web UI so a future mobile client can use it unchanged.
