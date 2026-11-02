# Self-hosting atproto QR

atproto QR is a static single-page app: no backend, no database, no server-side
logs. Codes are atproto records in each user's own PDS, so self-hosting is
building `dist/` and serving it from any static host.

## Deploy

- **Railway**: use the [template](https://railway.com/deploy/atproto-qrapp) or
  deploy the repo directly. `railpack.json` pins the node provider and Node 22;
  Railpack builds the Vite app and serves `dist/` through Caddy, including
  `/health`. `package.json` has no `start` script on purpose, so Railpack stays
  on the static path.
- **Vercel**: import the repo. `vercel.json` sets the build command, output
  directory and `index.html` rewrite.
- **Cloudflare Workers**: `wrangler.jsonc` serves `dist/` with an SPA fallback,
  so the deploy button or `wrangler deploy` works once the build has run.
  `VITE_DOMAIN` has to be a build variable (Settings → Build → Build variables
  and secrets), not a runtime var, or the build falls back to
  `https://atproto-qr.app` and sign-in fails on your domain.
- **Netlify**: the deploy button reads `netlify.toml`, which sets `pnpm build`,
  `dist`, Node 22 and the env var fields. `public/_redirects` provides the SPA
  fallback.
- **Cloudflare Pages**: build `pnpm build`, publish `dist`.
  `public/_redirects` provides the SPA fallback.
- **Anything else**: `pnpm install && pnpm build`, serve `dist/`, and fall back
  to `index.html` for unknown paths.

## Environment

- `VITE_DOMAIN` (optional): origin this instance is served from, e.g.
  `https://qr.example.com` or a bare `qr.example.com`. Generates the OAuth client
  metadata and redirect URI, and is the base of every link inside a QR code.
  Defaults to `https://atproto-qr.app`.
- `VITE_OWNER_HANDLE` (optional): runs the deployment as a personal instance
  pinned to that atproto handle. See below.

Both are build-time values, so changing either needs a rebuild. The committed
`.env` is a local-dev reference; a host's own environment wins over it.

`VITE_DOMAIN` must be exactly the origin users visit (scheme and host, no
trailing slash): clients fetch `{VITE_DOMAIN}/oauth-client-metadata.json`, written
into `dist/` at build time, and the redirect URI inside it has to match.

## Personal instance

Set both variables to run a single-owner instance, ideally on a short domain:

```bash
VITE_DOMAIN=https://qr.example.com
VITE_OWNER_HANDLE=you.example.com
```

- Codes live at `https://qr.example.com/#name` (`#name/edit` for the editor). The
  handle comes from the env var, so it never appears in the URL, and new dynamic
  codes encode the short link.
- Signing in with any other handle hands off to `https://atproto-qr.app`
  (hardcoded, not configurable). It is a cosmetic gate: nothing is stored
  server-side, and a visitor can only ever write to their own PDS.
- `/:handle/:id` returns not found. `/#name` is the only code URL.
- The signed-in owner does not see the tips guide. Strangers, and users of the
  multi-user app, still do.
- Records are shared, never copied: the instance reads the same PDS records as
  any other copy of the app.

A `#` fragment is never sent to a server, so code URLs have no per-code Open
Graph preview and never appear in access logs. Leave `VITE_OWNER_HANDLE` unset
for the multi-user app.

Local trial: `VITE_OWNER_HANDLE=you.example.com pnpm dev`
(`http://127.0.0.1:3000/#name`). Dev sign-in uses the loopback OAuth client, so
only the owner path is reachable; other handles redirect to the public instance.

## Migrating printed codes

Existing codes keep working: each one encodes the URL it was created with. To
move them without reprinting:

1. Recreate the code on your instance, copying the content across.
2. On `atproto-qr.app`, edit the old code's content to a URL pointing at the new
   page, e.g. `https://qr.example.com#name`.
3. Dynamic codes change content without changing the printed image, so every
   scan now forwards to your instance.

To keep a single record instead, just reprint: open the code on your instance,
save it, and it re-encodes with the short link.

## Image proxy (optional)

Embedding a logo draws it into a canvas, so the image host needs to send CORS
headers. The app defaults to the public `images.weserv.nl`, per code and
opt-in. To use your own, set it under **Settings → Image proxy**; it must accept
`GET ?url=<encoded>` and return CORS headers.

## Troubleshooting

- **"Client not found" on sign-in**: `VITE_DOMAIN` does not match the visited
  origin, or the metadata is unreachable. Check
  `curl -sI {domain}/oauth-client-metadata.json`. Unset, both the app and the
  generated metadata use `https://atproto-qr.app`, so a self-hosted copy has to
  set `VITE_DOMAIN` to its own origin.
- **Redirect URI mismatch after login**: same cause; the value must be scheme +
  host with no trailing slash, and the app must be rebuilt after changing it.
- **Deep links 404**: the host is not falling back to `index.html`. On Railway,
  drop any custom start command, which disables Railpack's static serving;
  elsewhere add the rewrite.
- **Sign-in fails on Cloudflare Workers**: `VITE_DOMAIN` was set as a runtime
  variable. Move it to Settings → Build → Build variables and secrets, then
  redeploy.
- **Railpack treats the app as Node**: set `RAILPACK_SPA_OUTPUT_DIR=dist`.
- **`pnpm install` fails in the build**: the lockfile and `pnpm-workspace.yaml`
  (pnpm 11 `allowBuilds`) must be present in the checkout.
- **Analytics or logos blocked**: the host has to forward the `Origin` header and
  must not strip CORS; the browser talks to arbitrary PDSes and analytics hosts
  directly.
