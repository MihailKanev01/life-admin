# REST API v1 — Initial Contract

All routes are under:

`/api/v1`

## Authentication

`POST /auth/register`
`POST /auth/login`
`POST /auth/logout`
`GET /auth/me`

Use secure session cookies for the web client.

For the web client, `GET /auth/me` should include:
- user id;
- email;
- display name;
- timezone;
- onboarding completion state/version.

The client uses this response to decide whether to show the authenticated workspace or first-run onboarding.

Future mobile authentication can use the same identity domain with a token-based flow without changing business resources.

## Things

`GET /things`
Query:
- q
- type
- includeArchived
- page
- pageSize

`POST /things`

`GET /things/{thingId}`

`PATCH /things/{thingId}`

`POST /things/{thingId}/archive`

## Reminders

`GET /reminders`
Query:
- status
- from
- to
- thingId

`POST /reminders`

`GET /reminders/{reminderId}`

`PATCH /reminders/{reminderId}`

`POST /reminders/{reminderId}/complete`

`POST /reminders/{reminderId}/snooze`

`POST /reminders/{reminderId}/reschedule`

## Payments

`GET /payments`

`POST /payments`

`GET /payments/{paymentId}`

`PATCH /payments/{paymentId}`

`POST /payments/{paymentId}/mark-paid`

## Documents

`POST /documents/upload-session`
Returns a short-lived signed upload target.

`POST /documents/finalize`

`GET /documents/{documentId}`

`POST /documents/{documentId}/download-session`

`DELETE /documents/{documentId}`

## Search

`GET /search?q=...`

Response groups/ranks:
- Things
- Reminders
- Payments
- Documents

## Household

`GET /household`

Later:
`POST /household/invitations`
`POST /household/members`
`DELETE /household/members/{userId}`

Household sharing is not required for the first single-user release but the domain model should support it.

## Response shape

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Validation error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "fields": {}
  }
}
```

## API rules

- Never return password hashes.
- Never trust client-supplied household ownership.
- Never expose raw storage keys when a signed URL can be used.
- Use DTOs.
- Validate all input server-side.
- Return consistent error codes.
- Support pagination for collection endpoints.
