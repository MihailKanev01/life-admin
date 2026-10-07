# ADR-003 — Account Gate and Onboarding

## Status

Accepted for prototype UX; production authentication is a separate implementation step.

## Decision

Every Life Admin user starts behind an account gate.

The prototype provides:
- account creation with name and email;
- sign-in for an existing prototype account on the same browser;
- an account surface showing the active personal workspace;
- sign-out;
- a first-run four-step onboarding walkthrough;
- replayable walkthrough;
- workspace data keyed by the account identifier.

The prototype intentionally does **not** implement passwords, tokens, or server authentication in browser storage.

## Production boundary

The production account flow must use the existing architecture:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- secure HttpOnly session cookie;
- Argon2id for password storage if passwords are used;
- server-side authorization on every user-owned resource;
- CSRF protection for cookie-authenticated state-changing requests.

User-owned Things, Reminders, Payments, Documents and Waiting items must be persisted with explicit ownership/household authorization.

## Onboarding principle

The walkthrough is short and task-oriented:

1. Understand the product promise.
2. Understand Things as real-world context.
3. Understand Quick Add and explicit confirmation.
4. Understand Home as the attention layer.

It can be skipped and replayed from Account.

## Rationale

A personal life-admin product needs identity before persistent personal data can be trusted, separated and eventually synchronized across devices.

The walkthrough is shown after first registration because the product model is not self-evident: the user needs to understand why Things, Quick Add and Home work together.

## Non-goals

This decision does not introduce:
- household sharing;
- social accounts;
- banking connections;
- AI automation;
- document upload;
- production identity verification.

Those remain separate decisions and validation steps.