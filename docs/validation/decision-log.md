# Validation Decision Log

## Status

Phase 1 has not passed its direct-evidence gate yet.

Online secondary evidence has been reviewed and recorded separately. It can inform what we test, but cannot substitute for participant sessions.

## Current decisions

### D001
Build web-first.

Reason:
- faster sharing and testing;
- single initial UI;
- reusable backend/API for later mobile.

### D002
Keep top-level navigation small.

Current hypothesis:
- Home
- Things
- Payments
- Search
- Quick Add

Reason:
- reduces cognitive load;
- keeps the product attention-first.

### D003
Keep Things as the contextual model, but do not lock the final data model until direct validation.

Reason:
- real online discussions repeatedly frame recurring maintenance around cars, homes, appliances and other real-world things;
- direct user mental models are still stronger evidence.

### D004
Do not build AI first.

Reason:
- online feedback supports faster AI-assisted capture, but also raises data-safety concerns;
- the underlying workflow needs validation before extraction is automated;
- AI should reduce input friction, not define the product.

### D005
Do not compete on reminders alone.

Reason:
- online users describe generic reminders as easy to ignore or as a second inbox;
- users report that reminders are more useful when they provide context, a clear next action, and easy rescheduling;
- the differentiator should be context + prioritization + Things, not another task list.

### D006
Keep Payments narrow.

Reason:
- online discussions show clear use of calendars/reminders for bills, subscriptions and renewals;
- existing banking/calendar/reminder tools are credible substitutes;
- the evidence is insufficient to justify expanding into a banking or budgeting product.

### D007
Documents should be connected to action and ownership context.

Reason:
- online paperwork discussions repeatedly mention receipts, warranties, home/car records and documents kept because they may be needed later;
- storage alone is not the full problem; retrieval and future action matter.

## Preliminary online evidence readout

| Hypothesis | Online read | Confidence |
|---|---|---:|
| H1 — Fragmented personal admin | Supported | Medium |
| H2 — Attention over storage | Supported | Medium–High |
| H3 — Fast capture | Supported | Medium–High |
| H4 — Things model | Supported | Medium |
| H5 — Recurring admin | Supported | High |
| H6 — Consolidated notifications | Supported with caution | Medium |
| H7 — Payments, not banking | Inconclusive | Low |
| H8 — Contextual documents | Supported | Medium |
| H9 — Household sharing | Supported | Medium |
| H10 — AI removes entry work | Promising | Low–Medium |

Full source material: docs/validation/online-secondary-evidence.md.

## Gate to pass Phase 1

Phase 1 can be marked complete only when:
- 10+ quality interviews are recorded;
- repeated high-value workflows are identified;
- top user profile is narrowed;
- Things model is validated or rejected;
- reminder behavior is understood;
- Payments placement is decided;
- MVP scope is updated from direct evidence.

Online evidence must remain labelled as secondary evidence in all summaries and decisions.
