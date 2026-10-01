#!/usr/bin/env sh
# Restore a database dump (and optionally media) made by backup.sh.
# Usage: ./scripts/restore.sh backups/db_2026-10-01_0200.dump [backups/media_2026-10-01_0200.tar.gz]
# This REPLACES the current data. The website is stopped during the restore.
set -eu

DUMP=${1:?Give the database dump file}
MEDIA=${2:-}

printf "This replaces all current website data with %s. Type RESTORE to continue: " "$DUMP"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

docker compose stop web
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$DUMP"

if [ -n "$MEDIA" ]; then
  docker compose run --rm --no-deps --user root -v "$(pwd)/backups:/backups" --entrypoint sh web -c "rm -rf /app/storage/* && tar -xzf /backups/$(basename "$MEDIA") -C /app"
fi

docker compose start web
echo "Restored. Check https://<your-domain>/api/health and sign in to the admin."
