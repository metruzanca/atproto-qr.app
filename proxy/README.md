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

### Docker

```bash
docker build -t atproto-qr-cors-proxy .
docker run -p 8080:8080 \
  -e ALLOWED_ORIGINS=http://127.0.0.1:3000,https://atproto-qr.app \
  atproto-qr-cors-proxy
```

### Railway

Create a service from the repo and set its **root directory** to `proxy/`.
Set the `ALLOWED_ORIGINS` variable, then generate a domain.

### Fly.io

`fly launch` from this directory with `build.include` = `[index.mjs]` (or
use the Dockerfile), and set `ALLOWED_ORIGINS`.

### Render

Create a web service from this directory, build command `npm i -g pnpm` is
not needed — just start command `node index.mjs`, or use the Dockerfile.
Set `ALLOWED_ORIGINS`.

### Any VPS

```bash
node index.mjs
```

Put it behind your reverse proxy (Caddy/Nginx) and set `ALLOWED_ORIGINS`.