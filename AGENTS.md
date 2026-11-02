# AGENTS.md

atproto-qr.app — a QR code generator with atproto-backed editable codes. Pure frontend SPA, **no backend**. Deployed on Railway.

## What the app does

1. **QR studio** (openqr.uk-style): design styled QR codes (content type + style controls), download PNG/SVG. Works anonymously.
2. **Editable codes**: sign in with an atproto account (Bluesky etc.), save a code to the user's own PDS, get a public URL `atproto-qr.app/{handle}/{name}`. The app never stores user data — records live in the user's PDS.

### Personal instance mode

Setting `VITE_OWNER_HANDLE` turns the deployment into a single-owner instance (e.g. `qr.zanca.dev`): the owner's handle comes from the env var instead of the URL, so code links shorten to `/#name` (`/#name/edit` for the editor). Non-owner sign-ins are handed off to the hardcoded `MAIN_ORIGIN` (`https://atproto-qr.app`). Unset `VITE_OWNER_HANDLE` = the regular multi-user app. **Every code URL must be built with `codePath`/`codeUrl` from `src/lib/personal.ts`** so both modes work.

`VITE_DOMAIN` says where the deployment lives (`https://qr.zanca.dev` or bare `qr.zanca.dev`). It drives the OAuth metadata/redirect **and** the origin baked into QR codes and previews, so dev (`127.0.0.1:3000`) never leaks into a generated code. It is the only origin variable — there is no alias.

## Stack

- Vite + **SolidJS** (solid-js 1.9) + Tailwind CSS 4, TypeScript (strict), `@solidjs/router` 1.0 (data router).
- atproto via atcute: `@atcute/oauth-browser-client` (OAuth 2.1, PKCE+DPoP+PAR, public client), `@atcute/client` (XRPC), `@atcute/identity-resolver` (handle→DID→PDS), `@atcute/atproto`/`@atcute/bluesky` (lexicons), `@atcute/lexicons`.
- QR rendering: `@liquid-js/qr-code-styling` (maintained fork of qr-code-styling; `QRCodeStyling`, `browserUtils.download`).
- Fonts: Geist Sans + Geist Mono, self-hosted via Fontsource (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`), imported in `src/index.tsx` — no third-party font requests.
- Design system ("Glacier Blue", `src/index.css`): Tailwind v4 `@theme` tokens (`--font-sans`/`--font-mono`, `--animate-*` keyframes) + `@layer components` classes: `.card`/`.card-hover` (frosted), `.btn-primary`/`.btn-secondary`/`.btn-danger`/`.btn-ghost`, `.badge`, `.section-label`, `.text-gradient`, `.hairline`, `.qr-stage` (dotted-grid QR backdrop), `.bg-mesh` (fixed gradient decoration), `.reveal`/`.is-visible` (scroll-reveal), `.collapsible` (grid-rows expand/collapse), `.spinner`. All animation is disabled under `prefers-reduced-motion`.
- Package manager: **pnpm 11**.

## Commands

```bash
pnpm dev        # vite dev server on http://127.0.0.1:3000
pnpm build      # vite build → dist/
pnpm preview    # vite preview
pnpm exec tsc --noEmit   # typecheck (there is no lint script)
```

## Routes

- `/` — Studio (Home): the generator; when signed in shows a Code type (Fixed/Dynamic) selector. Name field + Generate + "Save changes" appear for both kinds when signed in (creates a record, then navigates to `/edit`). In Fixed mode only dirty draft fields (content type `t=` + non-default content fields + non-default style fields, by form input name) are written to the URL query params (`draftToParams`/`draftFromParams` in `src/lib/qr/record.ts`) so the state survives reloads, history, and bookmarks; Dynamic mode stops syncing and the params clear naturally on save. Hero + Studio sit in a `min-h-[calc(100svh-6.5rem)]` fold wrapper, so the UsageGuide (`id="ideas"`, `scroll-mt-20`) always starts below the first screen when shown. `showGuide()` hides the guide and the hero's "Need inspiration?" prompt for a signed-in owner of a personal instance (it waits for `authReady()` so it doesn't flash); strangers on the same instance, and everyone else, still get it. Below the guide, `SelfHosting` (`id="self-hosting"`) pitches running your own instance with link stats (characters, print size), hidden in personal mode (that deployment is already self-hosted). Migrating already-printed codes is documented in `SELFHOST.md`, not on the page.
- `/login`, `/oauth/callback` — OAuth flow. `/login?handle=x` (how a personal instance hands a visitor over) continues straight into OAuth, because they already pressed Continue there; it waits for `authReady()` first so a restored session isn't re-authorized.
- `/codes` — list the user's saved QR records (was `/mine`).
- `/:handle/:id` — public page: URL-type instantly redirects to the data target; other types render the styled QR (dynamic codes render their stored `qrValue`, i.e. the app URL). Follows redirect records.
- `/:handle/:id/edit` — owner-gated editor; both kinds editable (Fixed records lock the data form behind a padlock + confirm, since changing data produces a new image; style is always editable; kind is locked except when converting a redirect, where the Code type selector reappears). Save updates or renames; Delete cascade-deletes. When the code is dynamic, an Analytics section offers No/Global/Custom tracking radios.
- **Personal mode** (only when `VITE_OWNER_HANDLE` is set): `/:handle/:id` and `/:handle/:id/edit` are registered to `NotFound`, and `/` doubles as the public page (`#name`) and editor (`#name/edit`). The hash is not a router path — `Root` re-reads it into the `hashTarget` signal (`src/lib/personal.ts`) on router changes and `hashchange`, and `HomeRoute` swaps the studio for `QRPublic`/`Editor` with an explicit `code` prop. No code URL is written with the handle in personal mode.
- `/settings` — signed-in only: global analytics config (stored in the user's settings record) + an "Apply to existing codes" checkbox list that opts dynamic codes into `tracking: { source: 'global' }`. Header link shown when signed in.
- `/about` — privacy/technical explainer.

## Data model (records in the user's PDS)

- `app.atproto-qr.qr` — a saved code. Shape: `{ $type, kind, content: { type, fields }, style, qrValue?, createdAt, updatedAt, aliases?: string[], tracking? }`.
  - `kind` = `'fixed'` | `'dynamic'`. **Dynamic**: the QR encodes the app URL `{origin}/{handle}/{name}`, snapshotted into `qrValue` at save/rename so the image never changes; content stays editable. **Fixed**: the QR encodes the real data via `contentToValue`; the record is a stored copy, and the data form is locked in the editor behind a confirm (changing it re-encodes → new image). Legacy records with no `kind` are treated as fixed.
  - **File content is always page-routed**: because atproto blobs don't store filenames and `getBlob` always sends `Content-Disposition: attachment; filename="<cid>"`, a raw getBlob QR would download as the CID. So a `file` code — fixed or dynamic — encodes the app page URL and snapshots it into `qrValue` (like a dynamic code), and the page's Download button serves the blob under its original filename via a client-side fetch + object URL. `qrValueFor` returns `qrValue` for dynamic codes and for file codes that have one; legacy fixed file records (no `qrValue`) still fall back to the getBlob URL.
  - `qrValue` = the exact string the QR encodes, stored for dynamic codes and file codes (snapshot of the app URL; stable across origin/handle changes). For other fixed codes it's absent — derive from `content` via `qrValueFor`.
  - `aliases` = every previous name this code has had (oldest first); used for cascade delete.
  - `tracking` = `{ source: 'global' }` | `{ source: 'custom', config }` — **dynamic codes only** (never set for fixed; the public page only fires for dynamic). `global` is a *reference*: resolved from the owner's settings record at render time, so global edits apply retroactively. `custom` carries a `TrackingConfig`. Absent = no tracking. `isValidRecord` tolerates any object here (lenient, never rejects the record).
- `app.atproto-qr.redirect` — created at an old name when a code is renamed. Shape: `{ $type, target, note, createdAt }`. `note` is a visible "DO NOT DELETE — keeps printed QR codes working" warning (shown to users browsing their PDS).
- `app.atproto-qr.settings` (rkey `preferences`) — `{ $type, theme, analytics?, imageProxy?, updatedAt }`. `analytics` = the global `TrackingConfig`; `imageProxy` = an optional global image-proxy URL (codes using the "default" proxy resolve it live). **`src/lib/theme.ts`, `src/lib/qr/tracking.ts`, and `src/lib/qr/imageProxy.ts` all read/write this same record; writes must merge (read-modify-write) or they clobber each other** (each preserves the other fields).
- `TrackingConfig` (`src/lib/qr/tracking.ts`): `{ provider: 'ga4'; measurementId; apiSecret? }` | `{ provider: 'plausible'; domain; endpoint? }` | `{ provider: 'umami'; websiteId; endpoint }` | `{ provider: 'matomo'; endpoint; siteId }`. GA4 with `apiSecret` uses the Measurement Protocol beacon (no script); without, it injects gtag.js. All beacons fire client-side from the public page; **no arbitrary third-party JS ever runs on the app origin** (it would be able to read OAuth sessions from localStorage).
- rkey = the code's user-chosen name. Generated names are `{adjective}-{animal}` (`src/lib/qr/name.ts`). Slugs: lowercase letters/digits/hyphens, ≤63 chars.

Rename flow (`src/pages/Editor.tsx`): validate name unique → `com.atproto.repo.createRecord` at new name with `aliases = [...old.aliases, oldRkey]` → `putRecord` a redirect at the old rkey → delete the old QR record → navigate to new edit page. Old URLs resolve via redirect records (public page follows hops client-side). Delete cascades the QR record + every alias redirect.

## Key source files

- `src/lib/appOrigin.ts` — `APP_ORIGIN`/`APP_HOST`: where this deployment is served, resolved from `VITE_DOMAIN` (falling back to `location.origin` in dev), and used as the base of every code URL. Never derive code links from `location` directly; a dev server would bake `127.0.0.1` into the QR.
- `src/lib/atproto/auth.ts` — `configureOAuth`, session store, sign-in/out, profile. `CLIENT_ID` differs dev (loopback) vs prod (metadata URL derived from `VITE_DOMAIN`).
- `src/lib/personal.ts` — personal-instance mode: `VITE_OWNER_HANDLE`, `MAIN_ORIGIN` (hardcoded `https://atproto-qr.app` hand-off target), `codePath`/`codeUrl` (the only place code URLs are built), `parseCodeHash`, and the `hashTarget` signal that backs `/#name` routing.
- `src/lib/atproto/records.ts` — record CRUD: `createQRRecord` (atomic name-uniqueness via createRecord), `putQRRecord`, `putRedirectRecord`, `getQRRecord`/`getRedirectRecord`, `listQRRecords`, `listAllNames` (QR + redirect keys for uniqueness), `cascadeDeleteQRRecord`, `uploadFile` (`com.atproto.repo.uploadBlob` → blob ref for the `file` content type).
- `src/lib/qr/content.ts` — 11 content types → payload string serializers (`contentToValue`); re-exports `codePath`/`codeUrl` from `src/lib/personal.ts`. File type stores a `BlobRef` in fields; `contentToValue` recomputes the getBlob URL (`{pds}/xrpc/com.atproto.sync.getBlob?did={did}&cid={cid}`) from `ContentContext { pdsUrl, did }` for serving the file — but the QR itself encodes the page URL, not this.
- `src/lib/qr/record.ts` — `QRRecord`/`Draft` types, `makeRecord`, `isValidRecord`, `qrValueFor(record, fallback, ctx?)` (effective QR payload: dynamic → `qrValue`; file with `qrValue` → `qrValue`; else `contentToValue`).
- `src/lib/qr/style.ts` — serializable `QRStyle` ↔ qr-code-styling options (`styleToOptions`). `imageProxy` (boolean, legacy-compatible) + optional `imageProxyUrl` (per-code custom proxy origin; absent = "default" proxy, resolved from the owner's global setting at render, then weserv.nl).
- `src/components/Studio.tsx` — shared generator (kind selector, content + style + preview + download + optional name/save block; `qrData` prop drives the encoded payload, name/save shown for both kinds; `contentLocked` overlays the data form with a padlock that unlocks via `ConfirmDialog`).
- `src/components/Reveal.tsx` — IntersectionObserver scroll-reveal wrapper; adds `.is-visible` to `.reveal` when the element enters the viewport (applied to UsageGuide sections and cards).
- `src/components/SelfHosting.tsx` — the self-hosting / true-ownership section on Home; link stats (characters, print size) computed from `APP_ORIGIN` via `qrModulesForBytes`, personalised when the signed-in handle is its own domain.
- `src/lib/qr/size.ts` — `qrModulesForBytes`: byte-mode QR capacity table (error-correction H) → matrix side in modules, so the UI can quote code sizes without rendering one.
- `src/lib/qr/name.ts` — slug validation, adjective/animal word lists, `generateCodeName`.
- `src/lib/qr/tracking.ts` — `TrackingConfig`/`QRCodeTracking` types + validation, `parseGtagId`, `fireTracking` (GA4 gtag/MP, Plausible, Umami, Matomo beacons, fire-once guard), and the `globalAnalytics` signal + `saveGlobalAnalytics` (settings-record read-modify-write).
- `src/lib/qr/imageProxy.ts` — global image-proxy settings: `globalImageProxyUrl` signal + `resolveProxyOrigin` (per-code URL → global → weserv.nl) + `saveGlobalImageProxy` (settings-record read-modify-write).
- `src/components/TrackingConfigFields.tsx` — shared provider form (used by Studio custom tracking and `/settings`).
- `src/pages/Settings.tsx` — global analytics config + "Apply to existing codes" opt-in list (writes `tracking: { source: 'global' }` to selected dynamic records).

## Critical gotchas

- **Solid, not React.** Never destructure props (`const { x } = props`) — it snapshots the value and breaks reactivity. Always read `props.x` in JSX or via `() => props.x`. Use `<Show>`/`For`. UI bugs from this have happened before (content-type tabs, style controls).
- **Never clear Solid-managed DOM with `textContent=''`.** It wipes the Solid-rendered nodes inside. `QRPreview` keeps its empty state as a **sibling** of the QR container, so wiping the container (to drop a stale QR) can't clobber the empty state.
- **pnpm 11**: build-script approval lives in `pnpm-workspace.yaml` under `allowBuilds` (`@tailwindcss/oxide`, `esbuild`). The old `pnpm.onlyBuiltDependencies` is ignored. Don't remove `allowBuilds` or installs fail with `ERR_PNPM_IGNORED_BUILDS`.
- **PDS rejects floats in records** (unknown-collection validator accepts only integer numbers). `style.imageSize` is stored as an integer percent (40 = 40%), converted to a 0–1 coefficient in `styleToOptions` (also tolerates legacy 0.4 values). Never put float fields in records.
- **Personal mode reuses `/` for code links.** The hash (`#name`, `#name/edit`) is *not* a route; it's a signal re-synced from `location.hash` whenever the router location or a `hashchange` event fires. Links must be root-relative `/#name` (from `codePath`) because a bare `href="#name"` would resolve against whatever path you're on. The *payload* (`codeUrl`) drops that slash — `https://host#name` — since a fragment needs no path; solid-router intercepts all same-origin anchor clicks and passes the hash through, so `A`/`<a>` both work; the router's `scrollToHash` will scroll to top for code hashes (no matching element id).
- **Don't add `href="#…"` in-page anchors.** They'd be parsed as code keys in personal mode; use `scrollIntoView` instead (see `Home.tsx`'s `scrollToIdeas`).
- **SPA fallback is per host.** Every unknown path must serve `index.html` or deep links (`/codes`, `/settings`, `/oauth/callback`) 404. On Railway, Railpack's Caddy does it (`try_files` with index fallback, plus `/health`); `vercel.json` (rewrite) covers Vercel; `public/_redirects` covers Netlify and Cloudflare Pages (it is copied into `dist/`); `wrangler.jsonc` (`assets.not_found_handling: single-page-application`) covers Cloudflare Workers, which ignores `_redirects`. `netlify.toml` pins the Netlify build (`pnpm build`, `dist`, Node 22) and declares the deploy-button env fields. Keep them in sync when adding a host. The self-hosting guide lives in `SELFHOST.md`.
- **No `start` script in package.json.** Deliberate, and it now does double duty: Railpack serves `dist` through Caddy only when there is no custom start command, and a `start` script would break that. `dev`/`build`/`preview` are the scripts. `railpack.json` pins the node provider (a root `public/` directory is a static-site trigger) and Node 22.
- **Dev OAuth** uses the loopback client (`http://localhost?redirect_uri=http://127.0.0.1:3000/oauth/callback...`); vite must stay on `127.0.0.1:3000` (`server.host` in `vite.config.ts`). Prod metadata is **generated at build time** from `VITE_DOMAIN` (`vite.config.ts` `oauthMetadataPlugin` writes `dist/oauth-client-metadata.json`); there is no `public/` metadata file. Set `VITE_DOMAIN=https://atproto-qr.app` on Railway so the client_id/redirect match the deployed origin (this is also how self-hosted copies pick up their own domain).
- **Public page redirects instantly** for URL-type codes (`window.location.assign`) — no interstitial, no countdown.
- Save/rename use the authed client (`agent` from auth store); public reads use `publicClient(pdsUrl)` after `resolveHandle`.

## Deployment

Railway + GitHub. Railpack builds the Vite SPA and serves `dist/` via Caddy (gzip/zstd, SPA fallback, `/health`) — no Dockerfile, no Caddyfile, no start command. `railpack.json` pins the node provider and Node 22. Set the build-time variable `VITE_DOMAIN=https://atproto-qr.app` on the service so the generated OAuth metadata, redirect URI and code links match the deployed origin. Deep links on other hosts are covered by `vercel.json`, `public/_redirects` and `wrangler.jsonc`; the full guide is `SELFHOST.md`.