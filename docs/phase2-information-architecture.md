# Phase 2 — Information Architecture

Status: Provisional pending direct user interviews.

## Product hierarchy

### Top level
1. Home
2. Things
3. Payments
4. Search
5. Quick Add

Settings, profile and help are secondary utilities and are not part of the main navigation.

## Why these sections exist

### Home
Answers: "What needs my attention?"

### Things
Answers: "What do I own or manage?"

Examples:
- Car
- Home
- Device
- Pet
- Personal item/service

### Payments
Answers: "What recurring payments and subscriptions should I know about?"

This is not a banking replacement.

### Search
Answers: "Where is the information I stored?"

Search should eventually work across things, documents, reminders, payments and notes.

### Quick Add
Answers: "How do I capture something in seconds?"

It is an action, not a destination. Desktop can expose it as a prominent button; mobile should keep it visually central.

## Navigation

### Desktop

Persistent sidebar:
- Home
- Things
- Payments
- Search

Primary action:
- + Add

Secondary:
- Settings
- Account

### Mobile

Bottom navigation:
- Home
- Things
- +
- Payments

Search:
- prominent top-level search action

Settings:
- account menu

Do not add Calendar, Tasks, Documents or Waiting as top-level navigation items in MVP.

## Content hierarchy

Home:
1. Needs attention
2. Coming up
3. Waiting
4. Calm empty state

Things:
1. Thing overview
2. Attention
3. Related records
4. History/details

Payments:
1. Upcoming
2. Recurring
3. Subscription detail

Search:
1. Query
2. Results grouped by type
3. Context preview
4. Detail

## Object relationship

A contextual Thing can own:
- reminders
- documents
- payments
- maintenance/history
- notes
- metadata

Example:

Thing: Mazda 6
- Reminder: service in 1,200 km
- Document: insurance PDF
- Payment: insurance renewal
- History: oil change

## Navigation rule

A user should rarely need more than two contextual levels before reaching meaningful information.

Example:
Things → Mazda → Insurance

Avoid deep folder systems.
