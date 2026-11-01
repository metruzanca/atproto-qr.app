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

2. Edit `selfhost/.env` and set `VITE_DOMAIN` to the public URL of this
   instance (scheme + host, **no trailing slash**):

   ```bash
   VITE_DOMAIN=https://qrs.example.com
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
| `VITE_DOMAIN`        | yes      | Where this instance is served — `https://qrs.example.com` or a bare `qrs.example.com`. Build-time; drives the OAuth client metadata + redirect URI and is the base of every code link (so previews and QR codes never encode `127.0.0.1`). |
| `VITE_OWNER_HANDLE`  | no       | Turns this into a **personal instance** pinned to that handle; code links become `{domain}/#name`. See below.              |
| `PORT`               | no       | Host port to publish Caddy on (default `8080`).                                                                           |
| `DOMAIN`             | no       | Your domain, e.g. `qrs.example.com`, to let Caddy manage TLS automatically. Unset = plain HTTP on port 80.                |

`VITE_DOMAIN` and `VITE_OWNER_HANDLE` are **build-time** values, so changing
them requires a rebuild (`docker compose up -d --build`).

## Personal instance mode

Set `VITE_OWNER_HANDLE` to your own atproto handle to turn this deployment into
a single-owner instance — the "one of my own QR codes" setup, ideally on a
short domain such as `qr.example.com`:

```bash
VITE_DOMAIN=https://qr.example.com
VITE_OWNER_HANDLE=you.example.com
```

What changes:

- **Short links.** Codes are served at `https://qr.example.com/#name` (and
  `#name/edit` for the editor) instead of `https://qr.example.com/you.example.com/name`.
  The handle never appears in the URL — it's read from the env var and used to
  look up your PDS. New dynamic codes encode the short link.
- **One owner.** On the sign-in page, any handle other than `VITE_OWNER_HANDLE`
  is handed over to the public `atproto-qr.app`, where the sign-in continues
  automatically, so visitors of someone else's instance get a normal experience
  on the shared app. That target is hardcoded, not configurable. Nothing is
  stored server-side either way: this is a cosmetic gate, and a stray session
  could only ever write to that visitor's own PDS.
- **Path links are off.** `https://qr.example.com/you.example.com/name` returns
  *page not found*; `/#name` is the only code URL.
- **Everything else is the same app**: `/codes`, `/settings`, `/about`, the
  studio, analytics, and the PDS-hosted records. Records aren't copied or
  migrated — the instance reads the same records as any other copy of the app.

Tradeoffs: a `#` fragment is never sent to a server, so code URLs have no
per-code Open Graph preview, and the fragment is not part of any access log.
Leave `VITE_OWNER_HANDLE` unset to keep the multi-user behaviour.

Local trial:

```bash
VITE_OWNER_HANDLE=you.example.com pnpm dev   # http://127.0.0.1:3000/#name
```

In dev, sign-in still uses the loopback OAuth client, so you can only test the
owner path (and a mismatched handle redirects to the shared deployment).

## Migrating existing codes

Codes you already printed keep working, because a code stores the URL it was
created with. To move them over without reprinting, keep one source of truth:

1. Recreate the code on your instance (copy its content across first, because
   the old record won't keep it).
2. On the public `atproto-qr.app`, open the old code and change its content to a
   URL pointing at the new page, e.g. `https://qr.example.com#name`. Save.
3. That's it. Dynamic codes let you edit their data without changing the printed
   image, so every scan now forwards to your instance, and the real content
   lives in exactly one record.

The old name forwards on your instance too, which is harmless: it only ever
points at the new one.

If you would rather not keep the old record around, just reprint: open the same
code on your instance, save it, and it re-encodes with the short link. Nothing
breaks before you get round to it.

## How it works

- **OAuth**: atproto clients resolve your OAuth client document at exactly
  `{VITE_DOMAIN}/oauth-client-metadata.json` (generated into `dist/`
  during the build by `vite.config.ts`), and the redirect URI inside it must
  match where users land after signing in. This is why the origin has to match
  the URL people actually visit.
- **Routing**: all SPA routes (`/`, `/login`, `/oauth/callback`, `/:handle/:id`,
  `/:handle/:id/edit`, `/codes`, `/settings`) fall back to `index.html`; static
  assets like `/oauth-client-metadata.json` are served as-is. In personal mode
  there are no `/:handle/:id` routes; codes are resolved from `/#name` on `/`.
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
  --build-arg VITE_DOMAIN=https://qrs.example.com \
  -t atproto-qr .

docker run --rm -p 8080:80 atproto-qr
```

## Troubleshooting

- **Sign-in fails with "client not found"** — `VITE_DOMAIN` doesn't match
  the URL you're visiting, or the metadata file isn't reachable. Verify:
  `curl -sI {domain}/oauth-client-metadata.json`.
- **Redirect URI mismatch after login** — same cause; the origin must be exactly
  the scheme + host, no trailing slash.
- **Analytics or logo images blocked** — make sure your reverse proxy forwards
  the `Origin` header and doesn't strip CORS; the app talks to arbitrary PDSes
  and analytics hosts directly from the browser.
- **`pnpm install` fails in the build** — the lockfile, `patches/`, and
  `pnpm-workspace.yaml` (pnpm 11 `allowBuilds`) are all copied into the build;
  if you've bumped dependencies, rebuild from a clean checkout.