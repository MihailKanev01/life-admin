# Domain ERD — MVP

The model below is intentionally relational and explicit. Avoid generic polymorphic "resource" tables until a real use case requires them.

```
USER
  id
  email
  password_hash
  display_name
  timezone
  onboarding_completed_at
  created_at
       |
       | 1..*
       v
HOUSEHOLD_MEMBER
  household_id
  user_id
  role
       |
       | *..1
       v
HOUSEHOLD
  id
  name
  created_at

HOUSEHOLD
       |
       | 1..*
       v
THING
  id
  household_id
  type
  name
  description
  metadata_json
  archived_at

THING 1..* ───────────────> REMINDER
                         id
                         thing_id
                         title
                         due_at
                         trigger_type
                         trigger_value
                         recurrence_rule
                         status

THING 1..* ───────────────> DOCUMENT
                         id
                         thing_id
                         storage_key
                         filename
                         mime_type
                         size_bytes
                         extracted_text
                         status

THING 1..* ───────────────> NOTE
                         id
                         user_id
                         thing_id
                         title
                         body
                         created_at
                         updated_at

THING 1..* ───────────────> PAYMENT
                         id
                         thing_id (nullable)
                         name
                         amount
                         currency
                         cadence
                         next_due_at
                         status

PAYMENT 1..* ─────────────> REMINDER
  optional payment_id

USER/HOUSEHOLD ───────────> WAITING_ITEM
                         id
                         title
                         status
                         expected_at
                         note

USER/HOUSEHOLD ───────────> NOTIFICATION
                         id
                         reminder_id
                         channel
                         scheduled_at
                         sent_at
                         status

USER/HOUSEHOLD ───────────> AUDIT_EVENT
                         id
                         actor_user_id
                         action
                         entity_type
                         entity_id
                         created_at
```

## Notes

### User vs Household

Personal data and household-owned data must be distinguishable.

A user can belong to multiple households later.

### Thing

A Thing is the primary context for real-world objects/services the user manages.

Examples:
- car
- home
- phone
- laptop
- pet

### Reminder

A reminder is an actionable timed/triggered item. It may belong to a Thing and/or Payment.

For MVP, keep the relationship explicit rather than introducing a generic polymorphic foreign key.

### Document

Metadata is stored in PostgreSQL; binary content is stored in private object storage.

### Payment

Payments are tracking records, not financial account transactions.

### Waiting item

A small entity for obligations blocked on an external person/company.

## Important indexes

- user.email unique
- household_member (household_id, user_id) unique
- thing (household_id, archived_at)
- reminder (household_id, status, due_at)
- reminder (thing_id, due_at)
- payment (household_id, next_due_at)
- document (thing_id, created_at)
- note (user_id, thing_id, updated_at)
- audit_event (household_id, created_at)

## Search

Initial MVP may use PostgreSQL ILIKE/search over normalized fields.

As volume grows, introduce a tsvector/GIN index for global search.
