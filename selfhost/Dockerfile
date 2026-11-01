# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ patches/
RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts ./
COPY src/ src/
COPY public/ public/

# Where this instance is served (scheme + host, or a bare domain). Required: it
# bakes the OAuth client metadata, the redirect URI, and the base of every code
# link into the build (see vite.config.ts + src/lib/appOrigin.ts).
ARG VITE_DOMAIN=
ENV VITE_DOMAIN=$VITE_DOMAIN

# Optional "personal instance" mode: pin this deployment to one account and
# serve its codes from short hash links (https://your.domain/#name). Leave
# VITE_OWNER_HANDLE empty for the regular multi-user app. Sign-ins with other
# accounts are handed over to the public atproto-qr.app.
ARG VITE_OWNER_HANDLE=
ENV VITE_OWNER_HANDLE=$VITE_OWNER_HANDLE

RUN pnpm build

# ---- serve stage ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY selfhost/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80