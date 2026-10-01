# syntax=docker/dockerfile:1.7
# Xpert Fintech website — production image (see docs/DEPLOYMENT.md).

FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Dependencies (cached until package files change)
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2. Build. NEXT_PUBLIC_* values are baked into the build, so pass the public address.
FROM deps AS builder
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_OUTPUT=standalone
COPY . .
RUN npm run build

# 3. One-off job: apply database migrations, then the idempotent seed.
FROM builder AS migrator
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# 4. The web server: a small standalone Node.js server, running as a non-root user.
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system app && useradd --system --gid app app \
  && mkdir -p /app/storage && chown app:app /app/storage
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
