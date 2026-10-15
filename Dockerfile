# syntax=docker/dockerfile:1
# Dibs: Next.js app. Build once, run anywhere with Node.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# the cache mount makes rebuilds on your laptop much faster (needs BuildKit, which Docker Desktop has by default)
# --no-audit/--no-fund skip two extra network calls that can stall on a slow or filtered connection
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --prefer-offline
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# this app has no public/ folder today (icons come from src/app); make sure one exists so the copy below never fails
RUN mkdir -p public && npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# the standalone server carries only what it needs; static files sit beside it (the app has no public/ folder)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
