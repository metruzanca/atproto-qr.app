# atproto QR

A beautiful QR code generator with **atproto-backed editable codes**. Pure frontend SPA: no backend, no database, no accounts of our own. Your codes live as records in your own Bluesky personal data server (PDS).

[Live app](https://atproto-qr.app)

## Features

### QR Code Editor

Design styled QR codes right in the browser, no sign-in needed. Eleven content types (URL, text, email, phone, SMS, WiFi, vCard, geo, event, crypto, and file), plus full styling: colors, shapes, dot styles, an embedded logo, and error-correction level. Live preview, PNG and SVG download.

### Two ways to make a code

**Fixed codes**: the simplest, and the default. The QR encodes your real data directly, like any QR generator. Saving just stores a copy in your PDS. The data is locked afterwards (changing it would re-encode, producing a new image), but you can restyle the appearance freely.

**Dynamic codes**: the QR encodes a stable link to the code's page. Sign in with your Bluesky (or any atproto) account to save a code to your own PDS and get a public URL like `atproto-qr.app/{handle}/{name}`. The app never stores your data; your records live on your PDS. Scan the code and the page reads the current record, so you can change the content anytime, and the printed QR never changes.

> **File uploads**: dynamic codes can also point at a single file you upload (up to 5 MB), stored as a blob on your PDS. Scanning the QR opens the file.

### Canonical links

Every saved code gets a permanent URL. Rename a code and the old URL is persisted as a redirect, so printed QRs never break.

### Optional analytics

Dynamic codes can opt into client-side analytics (Google Analytics, Plausible, Umami, or Matomo). Everything fires from the visitor's browser; no third-party scripts ever run on the app itself.

## How it works

Every line of code runs in your browser. When you save a code, your browser writes a record straight to *your* PDS via atproto's OAuth + XRPC. When someone opens a code's URL, their browser fetches the record directly from your PDS and renders it, with no middleman. The app hosts zero bytes of user data, so there's nothing to log, mine, or leak.

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

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/atproto-qrapp?utm_medium=integration&utm_source=button&utm_campaign=atproto-qr) [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmetruzanca%2Fatproto-qr.app&env=VITE_DOMAIN,VITE_OWNER_HANDLE&envDescription=I%20would%20recommend%20using%20the%20%60qr%60%20subdomain%20e.g.%20VITE_DOMAIN%3Dqr.sam.dev%20and%20VITE_OWNER_HANDLE%3Dsam.dev&envLink=https%3A%2F%2Fgithub.com%2Fmetruzanca%2Fatproto-qr.app%2Fblob%2Fmain%2FSELFHOST.md&project-name=atproto-qr&repository-name=atproto-qr&demo-url=atproto-qr.app) [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/metruzanca/atproto-qr.app) [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/metruzanca/atproto-qr.app)

The app is fully static: `dist/` runs on any static host, with nothing to run server-side. Railway, Vercel, Netlify, Cloudflare Pages and Cloudflare Workers are already configured in the repo. See [`SELFHOST.md`](SELFHOST.md) for more information.

`VITE_DOMAIN` is optional: set it to the origin you serve from (`https://qr.example.com`); unset, the build, its OAuth client metadata and every code link use `https://atproto-qr.app`.

## Privacy

This site has no backend: no database, no accounts, no logs, no analytics. The only server ever involved is your PDS, and only for signed-in features (saving, listing, editing, deleting).

## License

[MIT](LICENSE)
