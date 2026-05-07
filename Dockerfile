FROM oven/bun:1 AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder

ENV SKIP_ENV_VALIDATION=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

RUN mkdir -p /app/uploads/transfer
RUN touch /app/db.sqlite

EXPOSE 3000

CMD ["bun", "run", "start"]
