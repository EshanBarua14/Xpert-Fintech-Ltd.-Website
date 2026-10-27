#!/usr/bin/env bash
# Puts the built site (frontend + backend, one Node.js server) into dist/, ready to copy to the server.
# Needs a finished `next build` with NEXT_OUTPUT=standalone.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .next/standalone/server.js ] || { echo "No standalone build: run NEXT_OUTPUT=standalone npx next build first." >&2; exit 1; }
rm -rf dist && mkdir -p dist
cp -a .next/standalone/. dist/
mkdir -p dist/.next && cp -a .next/static dist/.next/static
cp -a public dist/public
# Database engines for every Linux the server may run (cPanel CloudLinux or an Ubuntu VPS).
mkdir -p dist/node_modules/.prisma/client
cp node_modules/.prisma/client/*.node node_modules/.prisma/client/schema.prisma dist/node_modules/.prisma/client/
cp deploy/app.js deploy/ecosystem.config.cjs dist/
rm -f dist/.env dist/.env.*
echo "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo unknown)} $(date -u +%FT%TZ)" > dist/REVISION
du -sh dist | sed 's/^/package size: /'
