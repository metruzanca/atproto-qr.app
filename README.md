# atproto QR

A beautiful QR code generator with **atproto-backed editable codes**. Pure frontend SPA — no backend, no database, no accounts of our own. Your codes live as records in your own Bluesky personal data server (PDS).

[Live app](https://atproto-qr.app)

## Features

### QR Code Editor

Design styled QR codes right in the browser, no sign-in needed. Eleven content types — URL, text, email, phone, SMS, WiFi, vCard, geo, event, crypto, and file — plus full styling: colors, shapes, dot styles, an embedded logo, and error-correction level. Live preview, PNG and SVG download.

### Two ways to make a code

**Fixed codes** — the simplest, and the default. The QR encodes your real data directly, like any QR generator. Saving just stores a copy in your PDS. The data is locked afterwards (changing it would re-encode, producing a new image), but you can restyle the appearance freely.

**Dynamic codes** — the QR encodes a stable link to the code's page. Sign in with your Bluesky (or any atproto) account to save a code to your own PDS and get a public URL like `atproto-qr.app/{handle}/{name}`. The app never stores your data — your records live on your PDS. Scan the code and the page reads the current record, so you can change the content anytime — the printed QR never changes.

> **File uploads** — dynamic codes can also point at a single file you upload (up to 5 MB), stored as a blob on your PDS. Scanning the QR opens the file.

### Canonical links

Every saved code gets a permanent URL. Rename a code and the old URL is persisted as a redirect, so printed QRs never break.

### Optional analytics

Dynamic codes can opt into client-side analytics (Google Analytics, Plausible, Umami, or Matomo). Everything fires from the visitor's browser; no third-party scripts ever run on the app itself.

## How it works

Every line of code runs in your browser. When you save a code, your browser writes a record straight to *your* PDS via atproto's OAuth + XRPC. When someone opens a code's URL, their browser fetches the record directly from your PDS and renders it — no middleman. The app hosts zero bytes of user data, so there's nothing to log, mine, or leak.

```
┌─────────────┐   OAuth 2.1 / XRPC    ┌───────────────────┐
│   Browser    │ ◄─────────────────► │    User's PDS       │
│  (this app)  │   at://did/…/qr/*     │    (their own data) │
└─────────────┘                       └───────────────────┘
      │  public reads via simpleFetchHandler
      └────────► every other visitor's browser
```

Your saved codes are records in your PDS (`app.atproto-qr.qr`). When you rename a code, a small redirect record is left at the old name so previously printed URLs keep working.

## Self-hosting

The app is fully static: `dist/` runs on any static host. There is no Docker setup to maintain and nothing to run server-side — see [`SELFHOST.md`](SELFHOST.md) for the full guide.

It is a single-page app, so every path has to fall back to `index.html` or deep links 404. That is wired up for the common hosts already:

- **Railway**: Railpack builds the Vite app and serves `dist/` through Caddy; [`railpack.json`](railpack.json) pins the Node provider and version.
- **Vercel**: [`vercel.json`](vercel.json) rewrites unmatched paths to `index.html`.
- **Netlify / Cloudflare Pages**: [`public/_redirects`](public/_redirects) does the same.

On any other host, add that fallback yourself. Set `VITE_DOMAIN` in the host's build environment too, or the OAuth metadata and code links will point at the wrong origin.

### Environment variables

| Env var               | Required | Description                                                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `VITE_DOMAIN`         | yes      | Where the app is served — `https://qr.example.com` or a bare `qr.example.com`. Build-time; generates the OAuth client metadata + redirect URI and is the base of every code link, so previews and QR codes get the real domain instead of `127.0.0.1`. |
| `VITE_OWNER_HANDLE`   | no       | Personal-instance mode: pin the deployment to this handle and serve its codes from `{domain}/#name`.          |

These are baked in at build time, so changing them requires a rebuild.

Set `VITE_OWNER_HANDLE` to run your own single-owner instance on a short domain — e.g. `qr.yourname.dev/#gg27` instead of `qr.yourname.dev/you.example.com/gg27`. The handle stays in the env var, links stay short, and the records still live in your PDS. See [the self-hosting notes](SELFHOST.md#personal-instance) for the details and tradeoffs.

### CORS image proxy for logos

To embed a logo, the app draws it into a canvas, which requires the image host to send CORS headers. Hosts that don't (most static hosts) get blocked by the browser, so the studio offers to route that one image through a CORS proxy — stored per code, opt-in only. The default is the free public `images.weserv.nl`; you can set any off-the-shelf CORS proxy as the global default under **Settings → Image proxy** — it just needs to accept `?url=` and return CORS headers (e.g. `corsproxy.io`). `data:`/`blob:` logo URLs never use a proxy.

## Privacy

This site has no backend: no database, no accounts, no logs, no analytics. The only server ever involved is your PDS, and only for signed-in features (saving, listing, editing, deleting). If the site itself goes down, your codes, links, and the ability to view them remain yours.

## License

[MIT](LICENSE)
