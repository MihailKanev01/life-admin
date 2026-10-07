# Privacy / GDPR Baseline

This is a product/engineering baseline, not legal advice.

## Principles

Design the product around:
- data minimization;
- purpose limitation;
- privacy by design/default;
- access control;
- retention limits;
- transparent user controls.

The European Commission describes data protection by design/default as implementing safeguards from the earliest design stages and limiting data access and retention to what is necessary. Source: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en

## MVP user rights flows

Provide:
- export personal data;
- delete account;
- delete individual documents;
- correct profile data;
- view/disable notifications;
- manage household sharing.

## Data classification

### Normal personal data
- name
- email
- household metadata
- reminders
- payments metadata

### Potentially sensitive
- document contents
- addresses
- identity documents
- insurance documents

Avoid collecting health information in MVP.

## Retention

Define retention per data type.

Examples:
- active records: until deletion;
- temporary upload artifacts: short TTL;
- failed extraction artifacts: short TTL;
- audit data: fixed operational retention;
- deleted-account data: deletion workflow with documented legal exceptions if any.

Exact retention periods must be reviewed before production.

## Processors

Maintain a list of third-party processors:
- hosting
- database
- object storage
- email
- AI/OCR
- analytics/error tracking

Before production, confirm DPAs, processing locations and transfer mechanisms.

## Privacy defaults

Default:
- documents private;
- household sharing off until explicitly enabled;
- analytics minimal;
- no sale of personal data;
- no AI sharing without a clear product need and user-visible explanation.

## User trust

The UI should explicitly explain:
- why a document was uploaded;
- why AI is reading it;
- what data is extracted;
- what will be stored;
- how to remove it.
