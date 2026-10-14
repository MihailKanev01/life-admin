# Phase 2 — Screen Specification

Status: Provisional.

## 1. Home

### Purpose
Surface only information that may require attention.

### Above the fold
- Greeting
- Needs-attention count only when non-zero
- 1–5 high-priority attention items

### Below
- Coming up
- Waiting

### Empty state
"You're all caught up."
"No important items need your attention."

### Required actions
- Complete
- Snooze/reschedule
- Open detail
- Quick Add

### Explicitly avoid
- completion percentage
- generic analytics
- large KPI grids
- full calendar
- long overdue dump

---

## 2. Things

### Purpose
Browse the real-world objects/entities the user manages.

### List row
- icon/photo
- name
- short metadata
- attention indicator if needed

### Detail
- title
- primary metadata
- attention items
- related documents
- payments
- maintenance/history
- notes

### Required actions
- add
- edit
- archive
- search within context

---

## 3. Payments

### Purpose
Track recurring money obligations without becoming a banking app.

### Sections
- Upcoming
- Recurring
- Subscriptions

### Payment row
- name
- amount
- frequency
- next date
- linked Thing if relevant

### Required actions
- add
- edit
- mark paid
- skip/cancel tracking
- open related Thing

---

## 4. Search

### Purpose
Retrieve previously captured information fast.

### Search targets
- Things
- Documents
- Reminders
- Payments
- Notes

### Result behavior
Group by type only when useful; otherwise rank by relevance.

### Empty result
Explain no match and offer Quick Add.

---

## 5. Quick Add

### Purpose
Fast capture.

### Preferred flow

Input:
"Insurance for Mazda expires June 14"

System proposes:
- Thing: Mazda
- Record: Insurance
- Expiry: June 14
- Reminder: suggest 30 days before

User confirms.

### Fallback
Simple manual form.

### Rule
Never force users through multiple setup screens for a simple record.

---

## 6. Reminder interaction

Every reminder needs:
- due date/time or trigger
- context
- Done
- Snooze / Reschedule
- Edit
- optional note/document

Recurring reminders need a readable recurrence description.

Examples:
- Every month on the 15th
- Every 10,000 km
- Every 6 months

---

## 7. Document interaction

Document list should show:
- name
- type
- linked Thing
- relevant date
- optional status

Upload:
1. Select/upload
2. Validate
3. Optional OCR/AI extraction
4. Show proposal
5. User confirms
6. Save + link
