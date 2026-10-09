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

Persisted domains:
- user identity and onboarding completion state;
- user-owned reminders and scheduled email notifications;
- Things, contextual Payments and Things-linked Notes;
- private Documents metadata with file bytes in S3-compatible object storage;
- confirmed Quick Add expiry captures.

## Local development

Start PostgreSQL and local private object storage (MinIO). The Compose setup creates the `life-admin-documents` bucket and disables anonymous access:

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

The web client proxies `/api/v1/*` to the configured backend origin. Local uploads go directly to MinIO at `http://localhost:9000`; its console is at `http://localhost:9001`. Copy `.env.example` values into your shell or environment when overriding the defaults.

Documents support PDF, JPEG and PNG files up to 10 MiB. The API creates random storage keys, checks the uploaded bytes against the requested size, MIME type, file signature and SHA-256 checksum, and issues short-lived signed upload/download URLs. The production bucket must remain private and have browser CORS configured for the deployed web origin.

Email notifications are scheduled at 09:00 in the user's timezone for 7 days before, 2 days before and the due date. To deliver real email, configure a managed SMTP/email provider through Spring Boot's `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, credentials and `MAIL_FROM` environment settings; never commit live credentials. Without a configured sender, deliveries are recorded as failed/retried and are not falsely marked as sent.

## Production deployment

Set `NEXT_PUBLIC_API_BASE_URL` in the deployed web environment to the real backend origin ending in `/api/v1`.

The frontend must never use the localhost fallback in production.

The backend must run with:
- TLS;
- PostgreSQL;
- Flyway migrations;
- secure HttpOnly session cookies;
- server-side authorization;
- production secrets from managed secret storage;
- a private EU-region S3-compatible bucket with server-side encryption, private access policy, browser CORS for the deployed web origin, and lifecycle/retention rules;
- a managed email provider and verified sender domain for reminder delivery.

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


## Quick Add and Notes

Notes are saved to an owned Thing and participate in user-scoped Search. The expiry Quick Add path lets the user review a record and expiry date before saving; confirmation saves the expiry as a Note and schedules a reminder 30 days beforehand in one database transaction. If the referenced active Thing does not exist, the confirmed capture can create it.

The Quick Add document option routes to the real private Documents upload screen. It does not create a temporary Home item.
