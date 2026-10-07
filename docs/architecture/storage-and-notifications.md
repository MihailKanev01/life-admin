# Storage and Notification Architecture

## Document storage

Use S3-compatible object storage.

Bucket:
- private
- no public listing
- server-generated object keys
- server-side encryption
- lifecycle/retention rules

Database stores:
- document ID
- household/user scope
- storage key
- filename
- MIME type
- file size
- checksum
- timestamps
- extraction status

Application never exposes the bucket directly.

### Upload

1. Client asks API for upload session.
2. API validates scope and allowed type/size.
3. API returns short-lived signed upload target.
4. Client uploads directly.
5. Client calls finalize.
6. Backend verifies object exists and records metadata.
7. Optional scan/extraction begins.

## Notification model

Channels:
- email in MVP
- web push after stable browser experience
- native push later

States:
- scheduled
- sent
- failed
- cancelled

A reminder can produce one or more notification attempts.

## Notification timing

Default examples:
- 7 days before
- 2 days before
- due today

Users can customize later.

Avoid notification spam. Prefer a digest for multiple low-priority items.

## Scheduling

Use Spring scheduled jobs for MVP.

Process:
- query due notification records;
- claim rows using a concurrency-safe pattern;
- send;
- mark success/failure;
- retry transient failures.

The notification scheduler must be idempotent so retries cannot send duplicate messages unintentionally.

## Time zones

Store timestamps in UTC.
Store user/household timezone separately.

Recurring reminders are calculated in the user's timezone.

Date-only deadlines should use a local-date field when time-of-day is irrelevant.

## Future scale

If job volume becomes large:
- add a dedicated queue;
- move notification workers out of the API process;
- introduce Redis/message broker only when measured load justifies it.

Do not add infrastructure prematurely.
