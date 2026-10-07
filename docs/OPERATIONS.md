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


## Email alerts for new leads

Every demo request and contact message is emailed to the addresses in
Admin → Settings → "Send new leads to" (or `LEAD_ALERT_EMAILS` in `.env` when
that is empty). The email is sent in the background after the visitor sees
"thank you", with up to three attempts; the lead's history in Admin → Leads
notes when it was sent. The subject names only the kind of enquiry and the
organisation, never the visitor's message.

`.env`:

```
SMTP_HOST=smtp.office365.com      # or your mail provider
SMTP_PORT=587                      # 465 with SMTP_SECURE=true
SMTP_SECURE=false
SMTP_USER=alerts@xpertfintech.com
SMTP_PASSWORD=…
MAIL_FROM="Xpert Fintech <alerts@xpertfintech.com>"
```

The password is never sent unencrypted: on port 587 the connection is
upgraded with STARTTLS, or sending stops.

## Activity log

Admin → Activity log lists every create, update and delete made by an admin:
who, what, which record, which fields (and values for status, trash and
publish dates), when and from which IP. It is recorded centrally in
`src/lib/db/client.ts`, so new admin screens are logged automatically.
Visitors' own submissions are not logged there.

## Redirects from the old website

Admin → Redirects sends visitors and search engines from an old address (for example a page of the previous www.xpertfintech.com) to its new home. Enter the old address without /en or /bn (a pasted full URL is cleaned up), and choose Permanent (301) unless the move is temporary. A redirect is used only when no page exists at that address. Each redirect shows how often it has been used; switch it off or delete it when the count stays at zero.

## Admin accounts

Admin → Admins: add an admin, edit any admin's name or sign-in email, reset a password, switch off two-factor for someone who lost their phone, deactivate (keeps the account, blocks sign-in) or remove for good. You cannot deactivate or remove yourself or the last active admin. The activity log keeps a removed admin's past changes. Forgotten your own password? On the server: `npm run admin:password -- you@xpertfintech.com`.

## Light and dark mode

Visitors and admins get their device's setting on the first visit; the sun/moon button switches it and is remembered on that device (for both the website and the admin portal). Photo and video cards, the video player and the photo viewer stay dark in both modes on purpose, so pictures read well.

## Importing the old website

`npm run import:live-site` copies www.xpertfintech.com (WordPress) into this site once: every image into the media library, news posts into News with redirects from their old addresses, and the people, client logos and testimonials it can recognise from the page layouts. It also adds the portraits in `prisma/seed-media/people/` to the media library. Re-running only adds what is new. Check `live-site-import/report.md` afterwards; each old page's text is saved next to it.

- `-- --dry` shows what would be imported without changing anything.
- `-- --allow-expired-certificate` reads the old site although its security certificate has expired (renew it: visitors see a warning).
- `-- --logos-approved` shows imported client logos straight away (only if XFL has permission to display them).

Imported testimonials arrive as drafts: open each in Admin → Testimonials, tick “Written approval from this person is on file” and publish.

## Testimonials

Admin → Testimonials: name, organization (its name and logo appear with the quote), the person's title and quote in English and Bangla, an optional photo, and the order. A quote can be published only with the person's written approval on file. Published quotes appear in the slider on the home page.

## Office map and registration details

Admin → Settings → Contact: “Google Maps location” takes a Google Maps share link (the pin is taken from it) or the address from Share → Embed a map; empty, the map shows the office address. Office hours appear beside the map on the Contact page. Settings → Registration and regulation: shown in the footer of every page.

## People, departments and messages

`npm run db:seed:content` adds the Board, the Management Committee and the whole team from XFL's list (`src/content/xfl2/people.ts`), in order of position, with the board portraits in `prisma/seed-media/people/`. It only fills in what is empty, so anything changed in Admin → People stays as it is, and it moves the old "Name to be confirmed" board cards to the trash.

- **Order**: each group (Board, Management, Team) has its own order number on the person's page in Admin → People; lower comes first.
- **Department**: set on the person's page. It colours the card and adds a filter chip on the Team page. Leadership, Engineering, Support, Infrastructure, Marketing and Operations have their own colours; any other name gets a neutral one.
- **Chairman's and MD's messages**: Admin → Messages. The text supplied at setup is a draft for them to approve; it appears on the About page and on the Board or Management page only after "Publish on the website" is ticked.
- **Market-share goal**: Admin → Market data → Market-share goal (set to 70% by 2028). The home page shows the latest DSE and CSE share combined, a progress bar towards the goal, and the client base.
