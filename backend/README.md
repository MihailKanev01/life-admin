# Life Admin API

Spring Boot 4.1.1 backend for the Life Admin web-first product.

## Stack

- Java 21
- Spring Boot 4.1.1
- Spring MVC
- Spring Security
- Spring Session JDBC
- Spring Data JPA
- PostgreSQL
- Flyway
- Actuator

Spring Boot 4.1.1 is the current stable release used by this project. Spring Session JDBC provides database-backed HttpSession storage, while Spring Security provides authentication, authorization and CSRF protection. The application uses Argon2 for password hashing. See the official Spring documentation and OWASP session guidance.

## Run locally

Start PostgreSQL:

```bash
docker compose -f ../infra/docker-compose.yml up -d
```

Run API:

```mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The project does not currently include Maven Wrapper files.

Health:

```
GET http://localhost:8080/api/v1/system/health
```

## Authentication

Authentication endpoints:

```
GET  /api/v1/auth/csrf
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
PATCH /api/v1/auth/me/onboarding
POST /api/v1/auth/logout
```

The web client uses a secure session cookie rather than storing credentials or session identifiers in browser storage.

Production session cookie:

```
__Host-life-admin-session
HttpOnly
Secure
SameSite=Strict
Path=/
```

Local development overrides the cookie name and Secure flag so HTTP localhost works.

## User-scoped reminders

```
GET  /api/v1/reminders
POST /api/v1/reminders
POST /api/v1/reminders/{id}/complete
POST /api/v1/reminders/{id}/snooze
```

Every reminder is owned by the authenticated user. Server-side ownership checks prevent one user from addressing another user's reminder by ID.

## Database migrations

Flyway owns the production schema.

Current migrations:

- V2 — users
- V3 — Spring Session JDBC tables
- V4 — user-scoped reminders

Do not use Hibernate schema auto-update in production.
