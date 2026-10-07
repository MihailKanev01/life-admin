# ADR-001 — Web-first product

## Status
Accepted

## Context

The first product version should validate the concept quickly while remaining reusable for a future mobile app.

## Decision

Build a responsive web application first.

The backend/API and data model must be designed independently of the frontend so a later mobile application can consume the same API.

## Consequences

### Positive

- faster validation;
- one UI codebase initially;
- easier sharing/testing via URL;
- no early App Store / Play Store overhead;
- mobile app can later reuse the same backend.

### Negative

- push notifications and device integrations may be less capable than native apps;
- some mobile-specific UX will be deferred.

## Future

When the web beta proves retention and repeat use, build the mobile client on top of the existing API.
