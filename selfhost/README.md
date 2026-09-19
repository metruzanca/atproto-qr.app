# Self-hosting atproto QR

This directory contains everything you need to run your own instance of atproto
QR with Docker. It lives in `selfhost/` rather than at the repo root on purpose:
Railway's Railpack auto-detects a root-level `Dockerfile`, and this project is
deployed to Railway **without** one. Nothing in this directory affects that
deploy.

## What you get

A multi-stage build that produces the same result Railway serves:

- Stage 1 builds the SPA with pnpm (Vite → `dist/`).
- Stage 2 serves `dist/` with Caddy: gzip/zstd compression, SPA fallback, and a
  `/health` endpoint.

The app is fully static — no database, no backend. The only servers it ever
talks to are your users' atproto PDSes and whatever analytics hosts they opt
into.

## Quick start

1. Copy the environment template:

   ```bash
   cp selfhost/.env.example selfhost/.env
   ```

2. Edit `selfhost/.env` and set `VITE_PUBLIC_ORIGIN` to the public URL of this
   instance (scheme + host, **no trailing slash**):

   ```bash
   VITE_PUBLIC_ORIGIN=https://qrs.example.com
   ```

3. Build and start:

   ```bash
   docker compose -f selfhost/docker-compose.yml up -d --build
   ```

4. Open your instance — `http://localhost:8080` locally, or your domain once
   deployed. Check `/health` returns `ok`.

## Configuration

| Env var              | Required | Description                                                                                                             |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VITE_PUBLIC_ORIGIN` | yes      | Public origin of this instance (no trailing slash). Baked in at build time; drives the OAuth client metadata + redirect URI. |
| `PORT`               | no       | Host port to publish Caddy on (default `8080`).                                                                           |
| `DOMAIN`             | no       | Your domain, e.g. `qrs.example.com`, to let Caddy manage TLS automatically. Unset = plain HTTP on port 80.                |

`VITE_PUBLIC_ORIGIN` is a **build-time** value, so changing it requires a
rebuild (`docker compose up -d --build`).

## How it works

- **OAuth**: atproto clients resolve your OAuth client document at exactly
  `{VITE_PUBLIC_ORIGIN}/oauth-client-metadata.json` (generated into `dist/`
  during the build by `vite.config.ts`), and the redirect URI inside it must
  match where users land after signing in. This is why the origin has to match
  the URL people actually visit.
- **Routing**: all SPA routes (`/`, `/login`, `/oauth/callback`, `/:handle/:id`,
  `/:handle/:id/edit`, `/codes`, `/settings`) fall back to `index.html`; static
  assets like `/oauth-client-metadata.json` are served as-is.
- **Health**: `/health` responds `200 "ok"` for load balancers / healthchecks.

## TLS options

- **Plain HTTP** (default): leave `DOMAIN` unset. Caddy listens on port 80 in
  the container, published on `${PORT:-8080}`.
- **Caddy-managed TLS**: set `DOMAIN=qrs.example.com`. Caddy obtains and renews
  certificates automatically; publish port 443 too by adding `443:443` to the
  `ports` list in `docker-compose.yml`.
- **Behind your own reverse proxy**: leave `DOMAIN` unset and proxy to the
  container's port 80 (Caddy/Nginx/Traefik all work).

## Optional CORS image proxy

To embed a logo, the app draws it into a canvas, which needs the image host to
send CORS headers. Hosts that don't can be routed through a proxy. By default
the app uses the free public `images.weserv.nl` (per code, opt-in only). To
self-host or use another provider, point the app at any off-the-shelf CORS
proxy by setting it as the global default under **Settings → Image proxy** in
the app — e.g. `corsproxy.io`. It just needs to accept `GET ?url=<encoded>`
and return CORS headers.

## Manual build without compose

```bash
docker build -f selfhost/Dockerfile \
  --build-arg VITE_PUBLIC_ORIGIN=https://qrs.example.com \
  -t atproto-qr .

docker run --rm -p 8080:80 atproto-qr
```

## Troubleshooting

- **Sign-in fails with "client not found"** — `VITE_PUBLIC_ORIGIN` doesn't match
  the URL you're visiting, or the metadata file isn't reachable. Verify:
  `curl -sI {origin}/oauth-client-metadata.json`.
- **Redirect URI mismatch after login** — same cause; the origin must be exactly
  the scheme + host, no trailing slash.
- **Analytics or logo images blocked** — make sure your reverse proxy forwards
  the `Origin` header and doesn't strip CORS; the app talks to arbitrary PDSes
  and analytics hosts directly from the browser.
- **`pnpm install` fails in the build** — the lockfile, `patches/`, and
  `pnpm-workspace.yaml` (pnpm 11 `allowBuilds`) are all copied into the build;
  if you've bumped dependencies, rebuild from a clean checkout.