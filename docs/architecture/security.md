# Security Baseline

## Authentication

Web:
- secure, HttpOnly session cookie
- SameSite policy selected for deployment topology
- TLS only
- logout/revocation
- rate limiting for login and recovery endpoints

If passwords are used:
- Argon2id
- unique salts
- no plaintext storage
- reasonable login throttling

OWASP recommends Argon2id, bcrypt or PBKDF2 for password storage and specifically recommends Argon2id with memory-hard settings. Source: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Authorization

Every request that accesses a user/household resource must verify:
1. authenticated principal;
2. household membership;
3. resource ownership/visibility;
4. action permission.

Do not rely on hidden client-side IDs.

## CSRF

If authentication uses cookies, protect state-changing requests against CSRF.

## File upload

Accepted types must be explicit.

Before persistence:
- validate extension;
- validate actual content type;
- enforce size limit;
- generate server-side storage key;
- optionally scan;
- store outside webroot/private bucket.

Never make document storage public by default.

OWASP recommends private/outside-webroot storage and explicit authorization for file access. Source: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

## Browser storage

Do not store authentication credentials/tokens or sensitive document data in localStorage.

OWASP notes that sensitive data should not be assumed safe in browser local storage. Source: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html

## Database

- TLS
- encryption at rest
- least-privilege DB user
- separate migration credentials
- no production credentials in source
- backups and restore tests

## Secrets

Use environment/secret management. Never commit secrets.

## Logging

Never log:
- passwords
- session IDs
- access tokens
- raw document contents
- sensitive personal data unless strictly required

Use structured logs with request IDs.

## AI

Documents can contain personal data. AI providers must be treated as processors/service providers where applicable.

Rules:
- send only the minimum necessary data;
- prefer providers/options that do not train on user data;
- define retention;
- use regional processing where available/appropriate;
- require user confirmation before creating important records.

## Threat model

Primary threats:
- account takeover
- broken object-level authorization
- malicious file upload
- accidental document exposure
- insecure AI ingestion
- CSRF
- XSS
- credential stuffing

Security testing should prioritize these paths.
