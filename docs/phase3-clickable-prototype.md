# Phase 3 — Clickable Prototype

Status: Built; validation pending.

## Purpose

Turn the Phase 2 information architecture into a small, navigable web prototype that can be used in user interviews and usability sessions.

## Included in prototype

### Home
- Greeting
- Needs attention
- Coming up
- Waiting
- Calm empty state
- Quick Add entry point

### Things
- Thing list
- Search within Things
- Object-oriented mental model

### Payments
- Upcoming
- Recurring
- Subscription summary

### Search
- Global search entry
- Suggested searches
- Result list across Things and Payments

### Quick Add
- Natural-language capture concept
- AI organization preview
- Reminder / Thing / Payment / Document entry points

### Reminder interaction
- Open attention item
- Done
- Snooze until tomorrow
- Close

## Prototype constraints

This is not production code.

It intentionally uses static/sample data and local React state.

The goal is to validate:
- hierarchy;
- terminology;
- navigation;
- attention model;
- capture flow;
- information density;
- mobile behavior.

## Validation gate

Do not treat the current UI as final.

Before visual polish and production architecture:
1. Test with real users.
2. Record first click and hesitation.
3. Identify navigation misunderstandings.
4. Validate whether "Things" is understood.
5. Validate whether Payments feels appropriately scoped.
6. Validate whether Home answers the user's first question.
7. Validate Quick Add against the user's natural way of capturing information.

## Local development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm start
```

## Branch

`phase-3/clickable-prototype`

## Important

The prototype should be changed freely based on user evidence. Avoid building backend, authentication or production persistence into this branch.
