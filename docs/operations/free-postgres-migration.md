# Free PostgreSQL migration (Render → Neon)

## Why this exists

The current Render Free PostgreSQL database was created on 8 October 2026 and expires on **7 November 2026**. Render Free Postgres is temporary; do not leave the only copy of important data there.

A practical $0 destination to evaluate is a Neon Free project. As of October 2026, Neon documents 1 GB per Free project. Its compute scales to zero after inactivity, so the first database request after idle time can still be slower. Recheck [Neon's current Free plan limits](https://neon.com/docs/introduction/plans) before creating the destination. A new provider account and project must be created by the account owner; this runbook does not create an account or enable paid billing.

## Safety rules

- Do not delete, suspend, or upgrade the current Render database as part of migration.
- Do not paste database URLs, usernames, passwords, or API keys into source control, a pull request, logs, or chat.
- The existing Render database has an empty external IP allowlist. To use its **external** connection URL, temporarily allow only your current public IPv4 address as a `/32`. Do not use `0.0.0.0/0`. Remove the temporary allowlist entry after the backup and migration.
- Use a fresh destination database. The script refuses to import into a destination whose `public` schema contains objects.
- The script writes a local private backup, restores in one transaction, compares every user table's row count, and never changes Render's `DATABASE_URL`.
- Keep the old database untouched until the app is verified on the new one.

## Requirements

- Bash (Linux, macOS, WSL, or Git Bash on Windows)
- Python 3
- PostgreSQL 18 client utilities: `psql`, `pg_dump`, and `pg_restore`
- A new PostgreSQL 18 destination on the free tier, such as Neon Free
- Render's **external** database URL and the destination's **direct** connection URL, both kept secret

PostgreSQL 18 is deliberate: the current Render database reports version 18, so the script refuses to run with a mismatched source, destination, or dump utility.

## Procedure

1. Create a new PostgreSQL 18 project on the selected provider's Free plan. Confirm the project is on a $0 plan and don't enable paid add-ons.
2. In Render's database networking settings, temporarily allow only your current public IPv4 address in CIDR `x.x.x.x/32`. Obtain the Render **external** connection URL from the dashboard; don't use its private/internal URL from outside Render.
3. Copy the destination's **direct** PostgreSQL connection URL. Ensure it includes TLS (typically `sslmode=require`). Do not use a pooled URL for the dump/restore.
4. In a terminal, enter the URLs silently so they do not appear in the command history:

   ```bash
   read -r -s -p "Render external database URL: " SOURCE_DATABASE_URL; echo
   export SOURCE_DATABASE_URL
   read -r -s -p "Destination direct database URL: " TARGET_DATABASE_URL; echo
   export TARGET_DATABASE_URL
   bash scripts/migrate-postgres-free.sh
   unset SOURCE_DATABASE_URL TARGET_DATABASE_URL
   ```

5. Save the printed backup path. Keep that dump private; it contains the app's database contents.
6. If the script reports success, manually verify that the destination tables and data are present. Test the application against the new connection before making it the production database.
7. Only after verification, change the Render API's `DATABASE_URL` to the destination connection string in the Render dashboard. This repository's startup configuration converts PostgreSQL URLs to JDBC URLs and runs Flyway migrations. Keep the old database intact while checking registration, login, Things, reminders, payments, notes, and document metadata.
8. Remove the temporary Render database IP allowlist entry. Keep the dump and old database until the migration has been accepted. Deleting the old database is deliberately outside this procedure.

## What is not automated

This script does not create a provider account, change hosting variables, deploy the API, delete the source, or imply that email recovery is configured. It requires valid connection URLs to be provided locally. If the destination is not completely empty, it stops before importing anything.
