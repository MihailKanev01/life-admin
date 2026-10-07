# Prototype E2E Smoke Tests

The prototype now has a Playwright smoke suite covering the core interaction paths without requiring a backend.

## Covered

- Home renders the attention hierarchy.
- Quick Add opens and exposes the capture field.
- Attention item can be completed.
- Attention item can be snoozed.
- Things navigation and sample Thing rendering.
- Payments navigation and sample payment rendering.
- Global Search navigation and a basic result lookup.

## Run locally

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

The test suite uses the dev server automatically and only exercises the current prototype's sample data.

## Scope

These tests are intentionally smoke-level. They verify that the prototype's critical interaction paths do not regress while product validation is underway.

They are not a substitute for real-user usability testing.
