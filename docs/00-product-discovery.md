# Product Discovery — Phase 0

Date: 2026-10-07
Status: Working hypothesis

## Decision we need to make

What personal life-admin product should we build for the web first, what must be in the MVP, and what deliberately stays out?

## Product hypothesis

People already have calendars, reminders, notes, banking apps and cloud storage. The gap is not another place to store information. The gap is an **attention layer** that connects information to real-world things and deadlines, then surfaces only what requires action.

### Core promise

> Everything important in your life, without the mental load of managing it.

### Positioning

> **Tell us what you have. We'll show you what matters.**

## Target user hypothesis

First target: working adult who manages a meaningful amount of personal administration and typically has some combination of a vehicle, household bills, subscriptions, purchases, warranties, documents and recurring maintenance.

This is a hypothesis to validate, not a locked persona.

## Jobs to be done

1. Remember an important deadline without maintaining a complicated system.
2. Understand what needs attention today or soon.
3. Find a document or fact when needed.
4. Track recurring bills/subscriptions without replacing a banking app.
5. Keep information attached to the real-world thing it belongs to.
6. Track things that are waiting on another person/company.
7. Capture something quickly with minimal typing.

## Core product loop

CAPTURE → CONNECT → ACT

### Capture

User enters natural language, a simple form, photo or document.

### Connect

The item is linked to a real-world object, payment, deadline or status.

### Act

Home surfaces the item when attention is needed.

## Initial information architecture

- Home
- Things
- Payments
- Search
- Quick Add (+)

Secondary details live inside these areas instead of becoming top-level navigation.

## Home model

Home should answer one question: **What needs my attention?**

Recommended order:

1. Needs attention
2. Coming up
3. Waiting
4. Calm empty state when nothing needs action

Avoid dashboards full of counts and unrelated cards.

## MVP candidate feature set

### Must have

- Account/auth
- Onboarding / guided setup
- Home / Needs Attention
- Things
- Reminders
- Recurring reminders
- Payments / subscriptions
- Documents linked to things
- Search
- Quick Add
- Notification preferences
- Responsive web UX
- Export and delete account

### Should have

- Document upload
- OCR
- AI extraction with explicit confirmation
- Email reminders
- Household sharing
- Calendar sync

### Later

- Gmail/Outlook discovery
- WhatsApp capture
- Bank integrations
- Government-data integrations
- Advanced AI assistant

## Explicit non-goals for MVP

- Full calendar replacement
- Full budgeting app
- Investment tracker
- Habit tracker
- Journal
- Pomodoro/focus system
- Social network
- Password manager
- Medical record system
- Huge product/manual database

## UX principles

### Principle 1 — Attention over inventory
Show what matters now, not everything stored in the system.

### Principle 2 — Recognition over recall
Use familiar categories and contextual suggestions; do not make the user remember system rules.

### Principle 3 — Progressive disclosure
Summary first, detail on demand.

### Principle 4 — One screen, one job
Each top-level destination has one clear purpose.

### Principle 5 — Fast capture
Adding something should be easier than opening Notes and typing manually.

### Principle 6 — AI proposes, user confirms
Never silently create important records from uncertain extraction.

### Principle 7 — Calm notifications
Notifications should prompt action without becoming noise.

## Validation gates

We do not move to implementation because the idea sounds good. We move when:

- repeated user pain is observed in interviews;
- the first-time user can understand the product without explanation;
- core tasks are completed successfully in prototype tests;
- the MVP can be described without a long feature list;
- privacy/security assumptions are documented before sensitive data is introduced.

## Success metrics for beta

Primary:
- Time to first meaningful item
- Time to understand today's attention
- % of users who return within 7 days
- % of surfaced reminders acted on / rescheduled

Secondary:
- Setup completion
- Search success
- Document retrieval success
- Notification opt-out rate
- Quick Add completion rate

## Biggest risks

1. Feature bloat turns the product into another productivity system.
2. Users do not have enough information to justify a dedicated app.
3. Reminders become noisy and are ignored.
4. AI extraction creates false confidence.
5. Documents create a serious privacy/security burden.
6. Competitors converge on the same feature set.

## Current research conclusion

The category has real demand and active competition. Therefore differentiation should come from the **experience of reducing mental load**, not from feature count.

The strongest product hypothesis is an attention-first system that uses real-world objects as the organizing context and keeps capture extremely fast.
