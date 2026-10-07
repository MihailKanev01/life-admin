# Life Admin

A web-first personal life-admin system focused on reducing mental load.

> Tell us what you have. We'll show you what matters.

## Product direction

Life Admin is not intended to be another generic productivity app. The core problem we are solving is fragmented personal administration: reminders, documents, recurring payments, owned things, warranties, maintenance and pending items are scattered across tools and often require the user to remember when to act.

The product should prioritize **attention over inventory**:

- Home answers: "What needs my attention?"
- Things answers: "What do I own/manage?"
- Payments answers: "What do I pay and when?"
- Search answers: "Where is the information?"
- Quick Add answers: "How do I capture something in seconds?"

## Account model

Every user has a personal account and their own server-backed workspace.

Current persisted domain:
- user identity;
- onboarding completion state;
- reminders.

The next persisted domain is Things, followed by contextual Payments and Documents.

## Local development

Start the API database:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Run the backend:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Run the web app:

```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api/v1 npm run dev
```

The web client proxies `/api/v1/*` to the configured backend origin.

## Production deployment

Set `NEXT_PUBLIC_API_BASE_URL` in the deployed web environment to the real backend origin ending in `/api/v1`.

The frontend must never use the localhost fallback in production.

The backend must run with:
- TLS;
- PostgreSQL;
- Flyway migrations;
- secure HttpOnly session cookies;
- server-side authorization;
- production secrets from managed secret storage.

## Delivery strategy

1. Product discovery
2. User interviews / validation
3. Information architecture
4. Wireframes
5. Usability testing
6. Visual design
7. Technical architecture
8. Web MVP
9. Beta + iteration
10. Mobile app on top of the same API

## Repository rules

- No feature is added to MVP without a clear user problem.
- No serious implementation before the user flow is validated.
- AI proposes; the user confirms.
- Home must remain attention-first and low-clutter.
- Backend/API must remain mobile-app ready.
