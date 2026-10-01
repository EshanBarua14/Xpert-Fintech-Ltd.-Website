#!/usr/bin/env sh
# Back up the database and uploaded media (Docker setup).
# Keeps 14 daily backups. Run from the project folder: ./scripts/backup.sh
set -eu

STAMP=$(date +%Y-%m-%d_%H%M)
DIR=./backups
mkdir -p "$DIR"

# 1. Database: compressed custom-format dump (restorable with pg_restore).
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' > "$DIR/db_$STAMP.dump"

# 2. Uploaded media (logos, screenshots, documents).
docker compose run --rm --no-deps --user root -v "$(pwd)/backups:/backups" --entrypoint sh web -c "tar -czf /backups/media_$STAMP.tar.gz -C /app storage"

# 3. Keep the latest 14 of each.
ls -1t "$DIR"/db_*.dump 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t "$DIR"/media_*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --

echo "Backup written: $DIR/db_$STAMP.dump and $DIR/media_$STAMP.tar.gz"
echo "Copy them off this server (see docs/OPERATIONS.md)."
