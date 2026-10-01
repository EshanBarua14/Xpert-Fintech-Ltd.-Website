# Operations: backups, restore and routine care

## What must be backed up

| What | Where | Why |
| --- | --- | --- |
| **Database** | PostgreSQL (`pgdata` volume) | All content, leads, admins, settings |
| **Uploaded media** | `media` volume (`/app/storage`) | Logos, screenshots, documents |
| **`.env`** | the server's project folder | Secrets — store a copy in your password manager, never in Git |

The code itself is in GitHub and does not need backing up.

## Daily backup (Docker)

`scripts/backup.sh` writes a compressed database dump and a media archive to
`./backups` and keeps the latest 14 of each.

Schedule it every night at 02:00 (Dhaka time) with cron:

```bash
crontab -e
# add:
0 2 * * * cd /srv/xpert/site && ./scripts/backup.sh >> backups/backup.log 2>&1
```

### Keep a copy off the server

A backup on the same machine does not survive the machine. Copy `./backups`
somewhere else every day, for example to another server or cloud storage:

```bash
# rsync to a second machine (after setting up SSH keys)
30 2 * * * rsync -az /srv/xpert/site/backups/ backup@backup-host:/backups/xpert/
```

Recommended retention: 14 daily, 8 weekly, 12 monthly copies off-site.

## Restore

```bash
cd /srv/xpert/site
./scripts/restore.sh backups/db_2026-10-01_0200.dump backups/media_2026-10-01_0200.tar.gz
```

The script asks you to type `RESTORE`, stops the website, restores, and starts it again.

**Practise once a quarter on a test machine.** A backup is only proven when it
has been restored: install the stack (docs/DEPLOYMENT.md) on a spare server,
restore the latest backup, sign in, and check a few pages and leads.

## Without Docker

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner > backups/db_$(date +%F).dump
tar -czf backups/media_$(date +%F).tar.gz storage
# restore
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backups/db_2026-10-01.dump
```

## Routine care

| How often | Task |
| --- | --- |
| Daily (automatic) | Backup; uptime monitor watches `/api/health` |
| Weekly | Check **Admin → Leads** for follow-ups due; glance at `docker compose logs --since 7d web` for errors |
| Monthly | `sudo apt update && sudo apt upgrade`; update the site (docs/DEPLOYMENT.md → *Updating*) |
| Quarterly | Restore drill on a test machine; review admin accounts and remove leavers |
| Yearly | Renew the market-data licence and update its expiry in **Admin → Market data** |

Items in the trash are deleted automatically after 30 days, and expired admin
sessions are cleaned up — no manual work needed.
