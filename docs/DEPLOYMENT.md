# Deployment guide

Two ways to run the site in production. **Option A (Docker)** is recommended:
the database, migrations and website come up with one command, and updates
are repeatable.

Before you start you need:

- A Linux server (Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 40 GB disk is plenty).
- The domain (e.g. `www.xpertfintech.com`) with a DNS **A record** pointing to the server's IP.
- SSH access as a user with `sudo`.

---

## Option A — Docker (recommended)

### 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out and back in afterwards
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

### 2. Get the code

```bash
sudo mkdir -p /srv/xpert && sudo chown $USER /srv/xpert
git clone https://github.com/EshanBarua14/Xpert-Fintech-Ltd.-Website.git /srv/xpert/site
cd /srv/xpert/site
```

### 3. Create the production `.env`

```bash
cp .env.example .env
nano .env
```

Set at least these (each must be different from your development values):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.xpertfintech.com` (no trailing slash) |
| `APP_ENV` | `production` |
| `POSTGRES_PASSWORD` | a long random password (`openssl rand -base64 32`) |
| `DATABASE_URL` | `postgresql://xpert:<POSTGRES_PASSWORD>@db:5432/xpert_nexus?schema=public` |
| `SESSION_SECRET` | `openssl rand -base64 48` — never change it later (it protects two-factor secrets) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | the first admin; **remove both lines after the first start** |
| `MARKET_DATA_MODE` | `exchange` (DSE/CSE price boards) or `licensed` (feed) or `none` — never `demo` |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional spam protection |

The server **refuses to start** if something important is wrong (for example
`http://` instead of `https://`, a short `SESSION_SECRET`, or demo market data)
and prints exactly what to fix: `docker compose logs web`.

### 4. Start

```bash
docker compose up -d --build
docker compose ps          # db and web "healthy", migrate "exited (0)"
curl -s http://127.0.0.1:3000/api/health
```

### 5. HTTPS with Caddy (automatic certificates)

```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
xpertfintech.com {
  redir https://www.xpertfintech.com{uri} permanent
}
www.xpertfintech.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
sudo systemctl reload caddy
```

Open `https://www.xpertfintech.com` — the certificate is issued automatically.

### 6. First sign-in

1. Go to `/admin`, sign in with the seed admin.
2. **Admin → Admins**: change the password and turn on **two-factor sign-in**.
3. Remove `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`, then `docker compose up -d`.
4. **Admin → Market data**: tick *Show market data on the website*, then *Test connection*.

### 7. Monitoring

Add `https://www.xpertfintech.com/api/health` to an uptime monitor (UptimeRobot,
Better Stack…). It returns `200` when the site and database are fine, `503` otherwise.

### Updating

```bash
cd /srv/xpert/site
./scripts/backup.sh                 # always back up first (docs/OPERATIONS.md)
git pull
docker compose up -d --build        # migrations run automatically before the site restarts
docker compose ps
```

### Rolling back

```bash
git log --oneline -5                # find the previous version
git checkout <commit>
docker compose up -d --build
```

If a migration has to be undone, restore the backup taken before the update
(docs/OPERATIONS.md → *Restore*).

---

## Option B — Without Docker (Node.js + PM2 + Nginx)

```bash
# Node.js 22 and PostgreSQL 16
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx
sudo -u postgres psql -c "CREATE ROLE xpert LOGIN PASSWORD '<password>';"
sudo -u postgres psql -c "CREATE DATABASE xpert_nexus OWNER xpert;"

# App
git clone https://github.com/EshanBarua14/Xpert-Fintech-Ltd.-Website.git /srv/xpert/site
cd /srv/xpert/site
cp .env.example .env && nano .env      # DATABASE_URL uses @localhost:5432
npm ci
npx prisma migrate deploy && npx prisma db seed
npm run build

# Keep it running
sudo npm install -g pm2
pm2 start npm --name xpert -- start
pm2 save && pm2 startup
```

Nginx: proxy `server_name www.xpertfintech.com;` to `http://127.0.0.1:3000`
and add HTTPS with `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`.

Update: `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart xpert`.

---

## Checklist before announcing the site

- [ ] `https://` works, `http://` redirects, the certificate is valid.
- [ ] `/api/health` returns 200 and is in the uptime monitor.
- [ ] Every admin has two-factor sign-in on; the seed password is gone from `.env`.
- [ ] Market data: real data (exchange or licensed), *not* demo; the licence reference is filled in.
- [ ] A backup has been taken **and restored once on a test machine** (docs/OPERATIONS.md).
- [ ] Contact email, phone and address are correct in Admin → Settings.
- [ ] Products, people and events you want visible are Published.
- [ ] Bangla text reviewed by an Xpert editor.
