#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$SCRIPT_DIR/migrate-postgres-free.sh"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

FAKE_BIN="$TEMP_DIR/bin"
CALL_LOG="$TEMP_DIR/write-tools.log"
OUTPUT="$TEMP_DIR/output.txt"
mkdir -p "$FAKE_BIN"
: > "$CALL_LOG"

cat > "$FAKE_BIN/psql" <<'FAKE_PSQL'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "$*" == *server_version_num* ]]; then
  if [[ "${1:-}" == *source.test* ]]; then
    printf '%s\n' "${FAKE_SOURCE_MAJOR:-18}"
  else
    printf '%s\n' "${FAKE_TARGET_MAJOR:-18}"
  fi
elif [[ "$*" == *nspname* && "$*" == *public* ]]; then
  printf '%s\n' "${FAKE_TARGET_PUBLIC_OBJECTS:-0}"
else
  echo "Unexpected psql invocation in migration safety test." >&2
  exit 91
fi
FAKE_PSQL
cat > "$FAKE_BIN/pg_dump" <<'FAKE_DUMP'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${1:-}" == "--version" ]]; then
  printf 'pg_dump (PostgreSQL) %s\n' "${FAKE_PG_DUMP_MAJOR:-18}.4"
  exit 0
fi
printf 'pg_dump\n' >> "$FAKE_CALL_LOG"
exit 0
FAKE_DUMP
cat > "$FAKE_BIN/pg_restore" <<'FAKE_RESTORE'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'pg_restore\n' >> "$FAKE_CALL_LOG"
exit 0
FAKE_RESTORE
chmod +x "$FAKE_BIN/psql" "$FAKE_BIN/pg_dump" "$FAKE_BIN/pg_restore"

expect_guard_failure() {
  local label="$1"
  local expected="$2"
  local source_url="$3"
  local target_url="$4"
  shift 4
  printf "TEST source_url=%q target_url=%q extra_env=%q\n" "$source_url" "$target_url" "$*" >&2
  : > "$CALL_LOG"
  if env PATH="$FAKE_BIN:$PATH" FAKE_CALL_LOG="$CALL_LOG" \
      SOURCE_DATABASE_URL="$source_url" TARGET_DATABASE_URL="$target_url" \
      "$@" bash -x "$SCRIPT" > "$OUTPUT" 2>&1; then
    echo "FAIL: $label unexpectedly succeeded." >&2
    cat "$OUTPUT" >&2
    exit 1
  fi
  if ! grep -Fq "$expected" "$OUTPUT"; then
    echo "FAIL: $label did not report the expected guard: $expected" >&2
    cat "$OUTPUT" >&2
    exit 1
  fi
  if [[ -s "$CALL_LOG" ]]; then
    echo "FAIL: $label invoked a data-writing database utility before refusing." >&2
    cat "$CALL_LOG" >&2
    exit 1
  fi
  echo "PASS: $label"
}

expect_guard_failure \
  "same database endpoint is rejected" \
  "same database endpoint" \
  "postgresql://source.test/life_admin_db?sslmode=require" \
  "postgres://source.test/life_admin_db"

expect_guard_failure \
  "PostgreSQL major-version mismatch is rejected" \
  "Expected PostgreSQL 18" \
  "postgresql://source.test/life_admin_db" \
  "postgresql://target.test/life_admin_db" \
  FAKE_SOURCE_MAJOR=18 FAKE_TARGET_MAJOR=17 FAKE_PG_DUMP_MAJOR=18

expect_guard_failure \
  "non-empty destination is rejected" \
  "Destination public schema is not empty" \
  "postgresql://source.test/life_admin_db" \
  "postgresql://target.test/life_admin_db" \
  FAKE_SOURCE_MAJOR=18 FAKE_TARGET_MAJOR=18 FAKE_PG_DUMP_MAJOR=18 \
  FAKE_TARGET_PUBLIC_OBJECTS=1

EXISTING_BACKUP="$TEMP_DIR/already-exists.dump"
: > "$EXISTING_BACKUP"
expect_guard_failure \
  "existing backup file is not overwritten" \
  "Backup file already exists" \
  "postgresql://source.test/life_admin_db" \
  "postgresql://target.test/life_admin_db" \
  BACKUP_FILE="$EXISTING_BACKUP" \
  FAKE_SOURCE_MAJOR=18 FAKE_TARGET_MAJOR=18 FAKE_PG_DUMP_MAJOR=18 \
  FAKE_TARGET_PUBLIC_OBJECTS=0

echo "All migration safety guard tests passed."
