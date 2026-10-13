#!/usr/bin/env bash
set -Eeuo pipefail

# Safe, manual migration from the current Render PostgreSQL database to a fresh
# PostgreSQL 18 destination. This script never changes Render's DATABASE_URL and
# never drops or truncates destination data.

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL to the Render external database URL}"
: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL to the new provider's direct connection URL}"
: "${BACKUP_FILE:=${HOME}/life-admin-backups/life-admin-$(date -u +%Y%m%dT%H%M%SZ).dump}"

for tool in python3 psql pg_dump pg_restore; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Required tool is missing: %s\n' "$tool" >&2
    exit 1
  fi
done

# Do not print connection URLs: they contain credentials.
database_identity() {
  DATABASE_URL_TO_CHECK="$1" python3 - <<'PY'
import os
import sys
from urllib.parse import urlsplit

parsed = urlsplit(os.environ["DATABASE_URL_TO_CHECK"])
if parsed.scheme not in {"postgres", "postgresql"} or not parsed.hostname or not parsed.path.strip("/"):
    print("A PostgreSQL URL with a hostname and database name is required.", file=sys.stderr)
    raise SystemExit(2)

print(f"{parsed.hostname.lower()}:{parsed.port or 5432}/{parsed.path.lstrip('/')}")
PY
}

source_identity="$(database_identity "$SOURCE_DATABASE_URL")"
target_identity="$(database_identity "$TARGET_DATABASE_URL")"
if [[ "$source_identity" == "$target_identity" ]]; then
  echo "Source and destination resolve to the same database endpoint. Aborting." >&2
  exit 1
fi

server_major() {
  psql "$1" --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align \
    --command="SELECT current_setting('server_version_num')::integer / 10000"
}

source_major="$(server_major "$SOURCE_DATABASE_URL")"
target_major="$(server_major "$TARGET_DATABASE_URL")"
pg_dump_major="$(pg_dump --version | awk '{print $3}' | cut -d. -f1)"

if [[ "$source_major" != "18" || "$target_major" != "$source_major" || "$pg_dump_major" != "$source_major" ]]; then
  printf 'Expected PostgreSQL 18 on source, destination, and local pg_dump; found source=%s destination=%s pg_dump=%s.\n' \
    "$source_major" "$target_major" "$pg_dump_major" >&2
  echo "Use PostgreSQL 18 client tools and a PostgreSQL 18 destination. No data was changed." >&2
  exit 1
fi

target_public_objects="$(psql "$TARGET_DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align \
  --command="SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')")"
if [[ "$target_public_objects" != "0" ]]; then
  echo "Destination public schema is not empty. Refusing to overwrite or merge data." >&2
  echo "Create a fresh destination database before retrying; no destination data was changed." >&2
  exit 1
fi

backup_dir="$(dirname "$BACKUP_FILE")"
umask 077
mkdir -p "$backup_dir"
if [[ -e "$BACKUP_FILE" ]]; then
  echo "Backup file already exists. Choose a new BACKUP_FILE to avoid overwriting it." >&2
  exit 1
fi

echo "Creating a private database backup..."
pg_dump --format=custom --no-owner --no-acl --file="$BACKUP_FILE" "$SOURCE_DATABASE_URL"
chmod 600 "$BACKUP_FILE"
pg_restore --list "$BACKUP_FILE" >/dev/null
echo "Backup created. Restoring into the empty destination in one transaction..."

# No --clean/--if-exists: the script refuses a non-empty target and never drops objects.
pg_restore --dbname="$TARGET_DATABASE_URL" --no-owner --no-acl --exit-on-error --single-transaction "$BACKUP_FILE"

table_row_counts() {
  psql "$1" --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align \
    --command="SELECT format('SELECT %L, count(*) FROM %I.%I;', schemaname || '.' || tablename, schemaname, tablename) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY schemaname, tablename" |
    psql "$1" --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align --field-separator='|'
}

echo "Comparing user-table row counts..."
source_counts="$(table_row_counts "$SOURCE_DATABASE_URL")"
target_counts="$(table_row_counts "$TARGET_DATABASE_URL")"
if [[ "$source_counts" != "$target_counts" ]]; then
  echo "Row-count verification failed. Keep the source database unchanged and inspect the backup/destination." >&2
  exit 1
fi

echo "Migration copy and row-count checks succeeded."
printf 'Private backup: %s\n' "$BACKUP_FILE"
echo "No Render setting was changed. Only update DATABASE_URL after manually verifying the destination and application."
