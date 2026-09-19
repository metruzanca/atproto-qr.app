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

# VITE_PUBLIC_ORIGIN is required: it bakes the OAuth client metadata and
# redirect URI into the build (see vite.config.ts). VITE_IMAGE_PROXY is
# optional and only used when you self-host the CORS image proxy.
ARG VITE_PUBLIC_ORIGIN=
ARG VITE_IMAGE_PROXY=
ENV VITE_PUBLIC_ORIGIN=$VITE_PUBLIC_ORIGIN \
    VITE_IMAGE_PROXY=$VITE_IMAGE_PROXY

RUN pnpm build

# ---- serve stage ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY selfhost/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80