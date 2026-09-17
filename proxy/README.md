# CORS image proxy

A tiny, zero-dependency CORS proxy for loading cross-origin logo images into
QR codes. The app fetches external image URLs with `crossOrigin: anonymous`
so it can draw them onto the canvas — hosts that don't send CORS headers
(most static hosts) block that. This proxy fetches the image server-side and
returns it with `Access-Control-Allow-Origin`, so the browser lets it through.

Runs anywhere Node ≥ 18 runs (Node, Bun, Docker, any PaaS that can run a
Node process or container). It's host-agnostic — nothing here is tied to a
specific platform.

## Run it

```bash
node index.mjs
```

Listens on `PORT` (default `8080`).

## Usage

```
GET /?url=<url-encoded target URL>
```

```bash
curl -sI "http://localhost:8080/?url=https://zanca.dev/icon.png" \
  -H "Origin: http://127.0.0.1:3000"
```

Returns the upstream body with `Access-Control-Allow-Origin`,
`Content-Type`, and a 1-day `Cache-Control`.

## Configuration

| Env var            | Description                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `PORT`             | Listen port (default `8080`).                                                                                  |
| `ALLOWED_ORIGINS`  | Comma-separated list of allowed `Origin` headers, e.g. `http://127.0.0.1:3000,https://atproto-qr.app`. When unset, the proxy is open to any origin (it logs a warning). |

Requests without a matching `Origin` are rejected with `403` when
`ALLOWED_ORIGINS` is set. Only `GET`/`OPTIONS` are accepted, and only
`http:`/`https:` targets.

## Deploying

Point your app at it by setting `VITE_IMAGE_PROXY` to this proxy's origin at
build time (e.g. `https://cors-proxy.example.com`). See the project
[README](../README.md) for the frontend side.

Run it anywhere Node ≥ 18 runs. The directory ships a `package.json` with a
`start` script (`node index.mjs`), so platforms that expect `npm start`
(Railway, Render, Fly.io) work with no extra config. Want a container? Wrap
it in any node image — e.g. `FROM node:20-alpine`, `CMD ["node", "index.mjs"]`
— or just run it on a VPS.

### Railway

Create a service from the repo, set its **root directory** to `proxy/`, and
set the `ALLOWED_ORIGINS` variable (no Dockerfile needed — Railpack detects
Node and runs `npm start`). Generate a domain.

### Render / Fly.io

Point a web service at this directory with start command `npm start` (or
`node index.mjs`), and set `ALLOWED_ORIGINS`.

### Any VPS

```bash
npm start   # or: node index.mjs
```

Put it behind your reverse proxy (Caddy/Nginx) and set `ALLOWED_ORIGINS`.