# Prototype E2E Smoke Tests

The prototype now has a Playwright smoke suite covering the core interaction paths without requiring a backend.

## Covered

Desktop:
- Home renders the attention hierarchy.
- Quick Add opens and exposes the capture field.
- Attention item can be completed.
- Attention item can be snoozed.
- Things navigation and sample Thing rendering.
- Payments navigation and sample payment rendering.
- Global Search navigation and a basic result lookup.

Mobile:
- Mobile bottom navigation remains visible and usable.
- Mobile Things navigation works.
- Mobile Quick Add opens.
- Mobile Payments navigation works.

Accessibility:
- Home is scanned with axe-core in light mode.
- Home is scanned with axe-core in dark mode.
- Serious and critical accessibility violations fail the suite.
- Text contrast tokens are checked indirectly through the automated scans.

Theme:
- Manual Dark mode / Light mode toggle is covered by E2E.
- The selected theme persists in localStorage.
- First paint follows the saved theme or the system preference when no saved choice exists.

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm run test:e2e
```

The test suite uses the dev server automatically and only exercises the current prototype's sample data.

## Scope

These tests are intentionally smoke-level. They verify that the prototype's critical interaction paths do not regress while product validation is underway.

They are not a substitute for real-user usability testing.

## Vercel deployment flow

Vercel Git integration keeps `main` as the production branch and feature branches as previews. For explicit releases from the verified build, the deployment is created with the Production target. Vercel also supports promoting an existing Preview deployment to Production without rebuilding it.
