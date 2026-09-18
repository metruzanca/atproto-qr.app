# atproto QR

A beautiful QR code generator with **atproto-backed editable codes**. Pure frontend SPA — no backend, no database, no accounts of our own. Your codes live as records in your own Bluesky personal data server (PDS).

[Live app](https://atproto-qr.app) · [About / privacy explainer](https://atproto-qr.app/about)

---

## What it does

**Fixed codes** — the QR encodes your real data directly, like any QR generator. Sign in to store a copy in your PDS for convenience. The data is locked in the editor afterwards (changing it re-encodes, producing a new image — that's gated behind a confirmation); you can restyle the appearance freely.

**Dynamic codes** — the QR encodes a link back to the app (`https://atproto-qr.app/{handle}/{name}`, snapshotted into the record at save time). Scan it, land on the code's page, which reads the current record from your PDS and renders the latest data. Change the data anytime — the printed QR never changes.

Both modes share the same studio: 11 content types (URL, text, email, phone, SMS, WiFi, vCard, geo, event, crypto, **file**), full styling (colors, shapes, dot styles, embedded image, error-correction level), live preview, and PNG/SVG download. The **file** type uploads a single file (up to 25 MB) as an atproto blob on your PDS; its QR encodes the blob URL (`{pds}/xrpc/com.atproto.sync.getBlob?did={did}&cid={cid}`, recomputed at render), so scanning redirects to the file.

---

## Why there is no server

Every line of code runs in your browser. When you save a code, your browser writes a record straight to *your* PDS via atproto's OAuth + XRPC. When someone opens a code's URL, their browser fetches the record directly from your PDS and renders it — no middleman. The app hosts zero bytes of user data, so there's nothing to log, mine, or leak.

```
┌─────────────┐   OAuth 2.1 / XRPC    ┌───────────────────┐
│   Browser   │ ◄────────────────────► │  User's PDS       │
│  (this app) │   at://did/…/qr/*     │  (their own data) │
└─────────────┘                       └───────────────────┘
      │  public reads via simpleFetchHandler
      └────────► every other visitor's browser
```

## Tech stack

- [Vite](https://vitejs.dev) + [SolidJS](https://solidjs.com) 1.9 + [Tailwind CSS](https://tailwindcss.com) 4 + TypeScript (strict)
- [@solidjs/router](https://github.com/solidjs/solid-router) 1.0 (data router)
- atproto via [atcute](https://github.com/atcute/atcute):
  - `@atcute/oauth-browser-client` — OAuth 2.1 (PKCE + DPoP + PAR, public client)
  - `@atcute/client` — XRPC
  - `@atcute/identity-resolver` — handle → DID → PDS
  - `@atcute/atproto` / `@atcute/bluesky` / `@atcute/lexicons`
- QR rendering: [`@liquid-js/qr-code-styling`](https://github.com/liquid-js/qr-code-styling) (maintained fork of `qr-code-styling`)
- Package manager: [pnpm](https://pnpm.io) 11

## Getting started

```bash
pnpm install
pnpm dev        # vite dev server → http://127.0.0.1:3000
pnpm build      # vite build → dist/
pnpm preview    # preview the production build
pnpm exec tsc --noEmit   # typecheck (no lint script)
```

Dev OAuth uses the loopback client, so vite must stay on `127.0.0.1:3000` (already pinned via `server.host` in `vite.config.ts`).

### OAuth / prod metadata

`CLIENT_ID` is handled automatically: dev uses the loopback client, prod uses a metadata URL derived from `VITE_PUBLIC_ORIGIN`. Prod metadata is **generated at build time** (`oauthMetadataPlugin` in `vite.config.ts` writes `dist/oauth-client-metadata.json`), so there is no committed metadata file.

```bash
VITE_PUBLIC_ORIGIN=https://atproto-qr.app pnpm build
```

This also lets self-hosted copies pick up their own domain.

## Data model (records in the user's PDS)

### `app.atproto-qr.qr`

```ts
{
  $type: 'app.atproto-qr.qr';
  kind: 'fixed' | 'dynamic';
  content: { type: ContentType; fields: Record<string, unknown> }; // 10 content types
  style: QRStyle;                                                  // serializable style options
  qrValue?: string;        // dynamic only: the exact app URL the QR encodes
  createdAt: string;
  updatedAt: string;
  aliases?: string[];      // every previous name (oldest first), for cascade delete
}
```

- **Dynamic** — the QR encodes `{origin}/{handle}/{name}`, snapshotted into `qrValue` at save/rename so the image never changes (stable across origin/handle changes). Content stays editable; the public page renders the record.
- **Fixed** — the QR encodes the real data (`contentToValue`). The record is a stored copy; the editor locks the data form behind a padlock + confirm because re-encoding changes the image. Legacy records with no `kind` are treated as fixed.

### `app.atproto-qr.redirect`

Created at an old name when a code is renamed, so previously printed URLs keep working. Public pages follow redirect hops client-side.

```ts
{ $type: 'app.atproto-qr.redirect'; target: string; note: string; createdAt: string }
```

The `note` ("DO NOT DELETE — keeps printed QR codes working") is visible to anyone browsing the PDS.

**Rename flow**: validate name uniqueness → `createRecord` at the new name with `aliases = [...old.aliases, oldRkey]` → `putRecord` a redirect at the old rkey → delete the old record. **Delete** cascades the record plus every alias redirect.

## Project structure

```
src/
├── components/          # Studio, ContentFields, StyleControls, QRPreview, ConfirmDialog, ui
├── lib/
│   ├── atproto/         # auth (OAuth), records (XRPC CRUD), resolve (handle→PDS)
│   └── qr/              # content serializers, style mapping, record/draft model, name gen
└── pages/               # Home, Editor, QRPublic, Mine, Login, Callback, About
```

- `src/lib/qr/record.ts` — `QRRecord`/`Draft` types, `makeRecord`, `isValidRecord`, `qrValueFor` (effective QR payload), and `draftToParams`/`draftFromParams` (fixed-mode URL persistence).
- `src/lib/qr/content.ts` — `contentToValue` serializers for all 10 content types, `codeUrl(handle, name)`.
- `src/lib/qr/style.ts` — serializable `QRStyle` ↔ qr-code-styling options.
- `src/components/Studio.tsx` — the shared generator: kind selector, content + style + preview + download, optional name/save block, and the fixed-code data lock.
- `src/lib/qr/name.ts` — slug validation and `{adjective}-{animal}` name generation.

### Fixed-mode URL persistence

While in Fixed mode, only **dirty** draft fields (content type `t=`, non-default content fields, non-default style fields — by form input name) are written to the URL query params, so a reload, history entry, or bookmark restores the exact QR. Dynamic mode stops syncing; the params clear naturally when saving redirects to `/edit`.

## Developer notes / gotchas

- **Solid, not React.** Never destructure props — read `props.x` in JSX or via `() => props.x` to keep reactivity. Use `<Show>`/`<For>`.
- **PDS rejects floats** in records. `style.imageSize` is stored as an integer percent (40 = 40%) and converted to a 0–1 coefficient in `styleToOptions`. Never write float fields to records.
- **`@atcute/oauth-browser-client` is patched** (`patches/`, registered in `pnpm-workspace.yaml`): the patch makes DPoP nonce retry detect `use_dpop_nonce` from the JSON body, because browsers can't read `WWW-Authenticate` over CORS. If you bump this package, re-apply/re-test the patch.
- **No `start` script** — deliberate. Railway's Railpack serves `dist` via Caddy only when there's no custom start command. Keep `dev`/`build`/`preview` as the only scripts.
- **pnpm 11**: build-script approval lives in `pnpm-workspace.yaml` under `allowBuilds`. Don't replace it with `pnpm.onlyBuiltDependencies` or installs fail.

## Deployment

Railway + GitHub. Railpack auto-detects the Vite SPA and serves `dist/` via Caddy (gzip/zstd, SPA fallback, `/health`). No Dockerfile, no Caddyfile. Set the build-time variable on the service:

```
VITE_PUBLIC_ORIGIN=https://atproto-qr.app
```

so the generated OAuth metadata and redirect URI match the deployed origin. The app also works on any static host — `dist/` is fully self-contained.

### CORS proxy for logo images

To embed a logo, the QR renderer fetches the image cross-origin and draws it
into a canvas, which requires the host to send CORS headers. Hosts that
don't (e.g. `zanca.dev/icon.png`) get blocked by the browser. The app routes
external image URLs through a CORS proxy (`proxyImageUrl` in
`src/lib/qr/style.ts`):

- By default it falls back to the free public proxy
  `images.weserv.nl` (`Access-Control-Allow-Origin: *`), so logos work out of
  the box — but that means external image URLs go through a third party.
- Self-host your own by setting the build-time variable
  `VITE_IMAGE_PROXY` to your proxy's origin (e.g. `https://cors-proxy.example.com`).

A portable, zero-dependency proxy lives in [`proxy/`](proxy/README.md)
(single Node ≥ 18 file + Dockerfile, runs anywhere). Lock it down with
`ALLOWED_ORIGINS=http://127.0.0.1:3000,https://atproto-qr.app`; unset, it
logs a warning and allows any origin.

## Privacy

This site has no backend: no database, no accounts, no logs, no analytics. The only server ever involved is your PDS, and only for signed-in features (saving, listing, editing, deleting). If the site itself goes down, your codes, links, and the ability to view them remain yours.

## License

[MIT](LICENSE)