# Life Admin

**A web-first personal administration workspace built to reduce mental load.**

> Tell us what you have. We'll show you what matters.

Life Admin brings the small but important parts of everyday administration into one place: reminders, recurring payments, documents, owned items, warranties, maintenance and pending tasks. The product is designed around **what needs attention next**, not just storing an inventory of information.

## Product Principles

- **Attention first:** make the next important action easy to identify.
- **Low clutter:** keep everyday workflows focused and lightweight.
- **User control:** AI may suggest actions, but the user remains in control.
- **API first:** keep the backend suitable for a future mobile client.
- **Private by default:** account data must be scoped and authorized server-side.

## Core Areas

| Area | Purpose |
| --- | --- |
| Home | Understand what needs attention |
| Things | Track what you own or manage |
| Payments | Keep recurring payments and due dates visible |
| Documents | Keep important information organised |
| Search | Find stored information quickly |
| Quick Add | Capture a task or item with minimal friction |

## Technology

- **Web:** Next.js, React, TypeScript
- **Backend:** Java, Spring Boot, Maven
- **Database:** PostgreSQL
- **Schema migrations:** Flyway
- **Local infrastructure:** Docker Compose
- **Authentication:** server-backed sessions with secure HttpOnly cookies

## Architecture

The web client communicates with the API through the `/api/v1/*` path. The backend owns persistence and authorization; the browser should not connect directly to the database or make security decisions.

```text
Next.js Web Client
        │
        ▼
/api/v1 proxy
        │
        ▼
Spring Boot API
        │
        ▼
PostgreSQL + Flyway
```

## Local Development

### Requirements

- Node.js and npm
- Java 21
- Maven
- Docker with Docker Compose

### 1. Start the local database

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Start the backend

In a separate terminal:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 3. Start the web client

In another terminal, from the repository root:

```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api/v1 npm run dev
```

Open the local address printed by Next.js. The web client proxies `/api/v1/*` requests to the configured backend origin.

On Windows PowerShell, set the environment variable for the current terminal before running the dev server:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8080/api/v1"
npm run dev
```

## Production Configuration

Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend origin ending in `/api/v1`. The frontend must not use a localhost fallback in production.

A production backend should use:

- HTTPS/TLS
- PostgreSQL and Flyway migrations
- Secure, HttpOnly session cookies
- Server-side authorization for every protected resource
- Managed production secrets
- A verified database backup and recovery approach

Never commit real credentials, API secrets or production environment files.

## Current Scope

Life Admin is under active development. The repository contains the web/API foundation and persisted user and reminder flows; additional domain areas are introduced as the related user workflows are validated.

## Development Principles

- Don't add an MVP feature without a clear user problem.
- Validate user flows before committing to larger implementation work.
- Keep Home attention-first and low-clutter.
- Treat AI output as a proposal; the user confirms consequential actions.
- Keep the API reusable by a future mobile application.
