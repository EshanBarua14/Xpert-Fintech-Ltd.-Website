# Deploying to Namecheap (xpertfintech.com)

The site is **one Node.js app**: public pages, admin console and API are served by the same
Next.js server, so one deploy updates frontend and backend together. The database stays on
Neon (PostgreSQL), the same one Vercel uses today, so no data has to move.

```
npm run deploy               # build on GitHub, upload over SSH, restart, check /api/health
npm run deploy -- rollback   # back to the previous release (kept on the server)
```

Nothing happens until the **green signal**: the GitHub variable `DEPLOY_ENABLED` must be `yes`,
and every run asks you to type `xpertfintech.com`. Until then Vercel keeps serving the site as now.

## How it works

`.github/workflows/deploy-namecheap.yml` (started by `npm run deploy` or GitHub → Actions → Run workflow):

1. applies database migrations (`scripts/migrate-on-deploy.mjs`);
2. builds a standalone Next.js server for `https://xpertfintech.com` on Linux, with database engines
   for CloudLinux (cPanel) and Ubuntu (VPS);
3. packages it (`deploy/package.sh`: server, static files, `public/`, `app.js`);
4. uploads it over SSH to `~/xpertfintech.new`, then `deploy/remote.sh` swaps it in
   (`~/xpertfintech`, previous release kept as `~/xpertfintech.prev`) and restarts;
5. checks `https://xpertfintech.com/api/health`.

The server never builds anything (shared hosting has too little memory for a Next.js build).

## One-time setup (before the green signal)

### 1. Namecheap hosting
- **Shared hosting (cPanel):** a plan with **"Setup Node.js App"** and SSH (Stellar Plus or Business
  recommended). Pick the datacenter closest to Bangladesh that Namecheap offers; the database is
  in Neon's region, so a far-away server makes uncached pages slower. A VPS works too (below).
- cPanel → **SSH Access** → Manage SSH Keys → import a new public key (made with
  `ssh-keygen -t ed25519 -f xfl_deploy -N ""`) and **Authorize** it. Namecheap's SSH port is **21098**.
- cPanel → **Setup Node.js App** → Create application:
  - Node.js version: **20** or newer (22 if offered) · Application mode: Production
  - Application root: `xpertfintech` · Application URL: `xpertfintech.com`
  - Application startup file: `app.js`
  - Do **not** press "Run NPM Install" (the upload already contains everything).
- Over SSH: `cp` the settings template to `~/xpertfintech.env` and fill it in
  (template: `deploy/server.env.example`). Copy `DATABASE_URL`, `SESSION_SECRET`, SMTP, market and
  Turnstile values **from Vercel → Settings → Environment Variables**. `SESSION_SECRET` must be the
  same, or every admin's two-factor sign-in is switched off.
- cPanel → **Cron Jobs**, daily backup (01:45 Dhaka = 19:45 UTC; cPanel uses the server's time zone):
  `curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://xpertfintech.com/api/cron/backup > /dev/null`

**VPS instead:** Ubuntu with Node.js 22, `npm i -g pm2`, Nginx proxying `xpertfintech.com` and
`www.xpertfintech.com` to `127.0.0.1:3000`, HTTPS with certbot. Set the variable `NC_MODE=vps`
and the SSH port of the VPS. `pm2 startup` once so the site comes back after a reboot.

### 2. GitHub (repository → Settings → Secrets and variables → Actions)
Secrets:
| Name | Value |
|---|---|
| `NC_SSH_HOST` | the server's host name or IP (cPanel → General Information → Shared IP) |
| `NC_SSH_USER` | the cPanel user name |
| `NC_SSH_KEY` | the **private** key (`xfl_deploy` file) |
| `DATABASE_URL` | same as Vercel (Neon, pooled) |
| `DIRECT_URL` | optional: Neon's direct address, for migrations |
| `SESSION_SECRET` | same as Vercel |

Variables: `NC_SSH_PORT` (default 21098), `NC_APP_DIR` (default `xpertfintech`), `NC_MODE`
(`cpanel` default, or `vps`), `SITE_HOST` (default `xpertfintech.com`), optional
`NEXT_PUBLIC_GA_MEASUREMENT_ID`. Optional: Settings → Environments → `production` → required
reviewers, so every deploy also needs a click of approval.

On your computer: install the GitHub CLI (https://cli.github.com) and run `gh auth login` once.

## Go live (on the green signal)

1. Namecheap → Domain List → xpertfintech.com: point it at the hosting (Nameservers "Namecheap Web
   Hosting DNS", or A records for `@` and `www` to the server IP). cPanel → **SSL/TLS Status** →
   Run AutoSSL; Domains → **Force HTTPS Redirect** on.
2. GitHub → Variables → `DEPLOY_ENABLED` = `yes`.
3. `npm run deploy` and type `xpertfintech.com`.
4. Check https://xpertfintech.com, sign in to `/admin`, send a test demo request.
5. Vercel → Settings → Environment Variables: add `CANONICAL_HOST=xpertfintech.com`, remove
   `NEXT_PUBLIC_NOINDEX`, redeploy: the old vercel.app address then forwards to the domain.
   (Or remove the Vercel project once the domain has been live for a while.)
6. Google Search Console: add `xpertfintech.com`, submit `https://xpertfintech.com/sitemap.xml`.

`CANONICAL_HOST` sends `www.` and any other address to `https://xpertfintech.com`
(src/middleware.ts); it is off while unset.

## Every update after that
`git push` to main as now, then `npm run deploy`. Content changes still go through the admin;
seed steps still run with `npm run db:seed:content` (same database).

## When something goes wrong
- `npm run deploy -- rollback` puts the previous release back (one step).
- Logs: `~/xpertfintech/stderr.log` (cPanel) or `pm2 logs xpertfintech` (VPS).
- `/api/health` says whether the database answers.
- Build on your own Linux machine instead of GitHub: `npm run build:server` makes `dist/`.
