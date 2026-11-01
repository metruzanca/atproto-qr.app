# Self-hosting atproto QR

atproto QR is a static single-page app: no backend, no database, no logs. Codes
are records in each user's own PDS and the browser talks to it directly, so
hosting it is just building `dist/` and serving it.

## Deploy it

Any static host works. These need nothing beyond the environment variables below,
because the repo already carries the single-page-app fallback each one expects.

- **Railway**: create a project from this repo. `railpack.json` pins the Node
  provider and Node 22; Railpack builds the Vite app and serves `dist/` through
  Caddy, which also answers `/health`.
- **Vercel**: import the repo. `vercel.json` sets the build command, the output
  directory and the `index.html` rewrite.
- **Netlify / Cloudflare Pages**: build command `pnpm build`, publish directory
  `dist`. `public/_redirects` ships the SPA fallback.
- **Anything else**: `pnpm install && pnpm build`, then serve `dist/`, falling
  back to `index.html` for unknown paths.

Then set `VITE_DOMAIN` in the host's environment and redeploy. Both variables are
build-time values, so changing them needs a rebuild, not a restart.

## Environment

| Variable            | Required | Description                                                                                                                                                                                                 |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_DOMAIN`       | yes      | Where this instance is served: `https://qrs.example.com` or a bare `qrs.example.com`. Generates the OAuth client metadata and redirect URI, and is the base of every link written into a QR code.               |
| `VITE_OWNER_HANDLE` | no       | Turns this into a **personal instance** pinned to that handle; code links become `{domain}/#name`. See below.                                                                                                 |

The committed `.env` is a reference for local development. A host's own
environment variables take precedence over it, and there are no secrets in it.

## Personal instance mode

Set `VITE_OWNER_HANDLE` to your own atproto handle to turn this deployment into a
single-owner instance, ideally on a short domain such as `qr.example.com`:

```bash
VITE_DOMAIN=https://qr.example.com
VITE_OWNER_HANDLE=you.example.com
```

What changes:

- **Short links.** Codes are served at `https://qr.example.com/#name` (and
  `#name/edit` for the editor) instead of `https://qr.example.com/you.example.com/name`.
  The handle never appears in the URL; it comes from the env var and is used to
  look up your PDS. New dynamic codes encode the short link.
- **One owner.** On the sign-in page, any handle other than `VITE_OWNER_HANDLE`
  is handed over to the public `atproto-qr.app`, where the sign-in continues
  automatically. That target is hardcoded, not configurable. Nothing is stored
  server-side either way: this is a cosmetic gate, and a stray session could only
  ever write to that visitor's own PDS.
- **Path links are off.** `https://qr.example.com/you.example.com/name` returns
  *page not found*; `/#name` is the only code URL.
- **Less marketing.** A signed-in owner does not see the tips guide on the home
  page. Everyone else (strangers, and users of the multi-user app) still does.
- **Everything else is the same app**: `/codes`, `/settings`, `/about`, the
  studio, analytics, and the PDS-hosted records. Records are not copied or
  migrated; the instance reads the same records as any other copy of the app.

Tradeoffs: a `#` fragment is never sent to a server, so code URLs have no
per-code Open Graph preview and the fragment never appears in access logs. Leave
`VITE_OWNER_HANDLE` unset for the multi-user behaviour.

Local trial:

```bash
VITE_OWNER_HANDLE=you.example.com pnpm dev   # http://127.0.0.1:3000/#name
```

Sign-in in dev still uses the loopback OAuth client, so you can only test the
owner path; a mismatched handle redirects to the public instance.

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
  `{VITE_DOMAIN}/oauth-client-metadata.json` (generated into `dist/` during the
  build by `vite.config.ts`), and the redirect URI inside it must match where
  users land after signing in. This is why the origin has to match the URL people
  actually visit.
- **Routing**: every route (`/`, `/login`, `/oauth/callback`, `/:handle/:id`,
  `/codes`, `/settings`) has to serve `index.html`, or deep links 404. Railway
  gets this from Railpack's Caddy, Vercel from `vercel.json`, Netlify and
  Cloudflare Pages from `public/_redirects`. Static files such as
  `/oauth-client-metadata.json` are served as-is. In personal mode there are no
  `/:handle/:id` routes; codes resolve from `/#name` on `/`.
- **No start command**: the app is a static site. `package.json` deliberately has
  no `start` script, so Railpack builds it and serves `dist/` instead of trying to
  run Node.

## Optional CORS image proxy

To embed a logo, the app draws it into a canvas, which needs the image host to
send CORS headers. Hosts that don't can be routed through a proxy. By default the
app uses the free public `images.weserv.nl` (per code, opt-in only). To self-host
or use another provider, point the app at any off-the-shelf CORS proxy by setting
it as the global default under **Settings → Image proxy** in the app, e.g.
`corsproxy.io`. It just needs to accept `GET ?url=<encoded>` and return CORS
headers.

## Troubleshooting

- **Sign-in fails with "client not found"**: `VITE_DOMAIN` doesn't match the URL
  you're visiting, or the metadata file isn't reachable. Verify with
  `curl -sI {domain}/oauth-client-metadata.json`. If the build logged
  `[oauth-client-metadata] VITE_DOMAIN is not set`, no file was generated at all.
- **Redirect URI mismatch after login**: same cause; the value must be exactly
  scheme + host, with no trailing slash.
- **Deep links 404**: the host isn't falling back to `index.html`. On Railway
  make sure no start command is configured (that would disable Railpack's static
  serving); elsewhere add the rewrite by hand.
- **Railpack doesn't detect the app as a static site**: set
  `RAILPACK_SPA_OUTPUT_DIR=dist` in the service's variables.
- **`pnpm install` fails in the build**: the lockfile, `patches/` and
  `pnpm-workspace.yaml` (pnpm 11 `allowBuilds`) all have to be present; rebuild
  from a clean checkout.
- **Analytics or logo images blocked**: make sure your host forwards the `Origin`
  header and doesn't strip CORS; the app talks to arbitrary PDSes and analytics
  hosts straight from the browser.
