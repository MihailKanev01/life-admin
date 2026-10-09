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

Application never exposes the bucket directly. Production must use an EU-region bucket, managed credentials/identity, a private access policy with no public listing/read access, server-side encryption, deployed-origin CORS for browser uploads, and documented lifecycle/retention rules. Never commit storage credentials.

The current MVP upload policy accepts PDF, JPEG and PNG files up to 10 MiB. The API signs a 10-minute upload target against the declared content type and SHA-256 checksum. After upload, finalization checks object existence, size, content type, actual checksum and the file signature before exposing the document. Downloads use owner-authorized 10-minute signed URLs. Local development uses MinIO; the in-memory storage adapter exists only in the test profile.

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
