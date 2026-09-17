# AGENTS.md

atproto-qr.app — a QR code generator with atproto-backed editable codes. Pure frontend SPA, **no backend**. Deployed on Railway.

## What the app does

1. **QR studio** (openqr.uk-style): design styled QR codes (content type + style controls), download PNG/SVG. Works anonymously.
2. **Editable codes**: sign in with an atproto account (Bluesky etc.), save a code to the user's own PDS, get a public URL `atproto-qr.app/{handle}/{name}`. The app never stores user data — records live in the user's PDS.

## Stack

- Vite + **SolidJS** (solid-js 1.9) + Tailwind CSS 4, TypeScript (strict), `@solidjs/router` 1.0 (data router).
- atproto via atcute: `@atcute/oauth-browser-client` (OAuth 2.1, PKCE+DPoP+PAR, public client), `@atcute/client` (XRPC), `@atcute/identity-resolver` (handle→DID→PDS), `@atcute/atproto`/`@atcute/bluesky` (lexicons), `@atcute/lexicons`.
- QR rendering: `@liquid-js/qr-code-styling` (maintained fork of qr-code-styling; `QRCodeStyling`, `browserUtils.download`).
- Package manager: **pnpm 11**.

## Commands

```bash
pnpm dev        # vite dev server on http://127.0.0.1:3000
pnpm build      # vite build → dist/
pnpm preview    # vite preview
pnpm exec tsc --noEmit   # typecheck (there is no lint script)
```

## Routes

- `/` — Studio (Home): the generator; when signed in shows a Name field + Generate button + "Save changes" (creates a record, then navigates to `/edit`).
- `/login`, `/oauth/callback` — OAuth flow.
- `/codes` — list the user's saved QR records (was `/mine`).
- `/:handle/:id` — public page: URL-type instantly redirects to the target; other types render the styled QR. Follows redirect records.
- `/:handle/:id/edit` — owner-gated editor; Save updates or renames; Delete cascade-deletes.
- `/about` — privacy/technical explainer.

## Data model (records in the user's PDS)

- `app.atproto-qr.qr` — a code. Shape: `{ $type, content: { type, fields }, style, createdAt, updatedAt, aliases?: string[] }`.
  - `aliases` = every previous name this code has had (oldest first); used for cascade delete.
- `app.atproto-qr.redirect` — created at an old name when a code is renamed. Shape: `{ $type, target, note, createdAt }`. `note` is a visible "DO NOT DELETE — keeps printed QR codes working" warning (shown to users browsing their PDS).
- rkey = the code's user-chosen name. Generated names are `{adjective}-{animal}` (`src/lib/qr/name.ts`). Slugs: lowercase letters/digits/hyphens, ≤63 chars.

Rename flow (`src/pages/Editor.tsx`): validate name unique → `com.atproto.repo.createRecord` at new name with `aliases = [...old.aliases, oldRkey]` → `putRecord` a redirect at the old rkey → navigate to new edit page. Old URLs resolve via redirect records (public page follows hops client-side). Delete uses `com.atproto.repo.applyWrites` to atomically remove the QR record + every alias redirect.

## Key source files

- `src/lib/atproto/auth.ts` — `configureOAuth`, session store, sign-in/out, profile. `CLIENT_ID` differs dev (loopback) vs prod (metadata URL).
- `src/lib/atproto/records.ts` — record CRUD: `createQRRecord` (atomic name-uniqueness via createRecord), `putQRRecord`, `putRedirectRecord`, `getQRRecord`/`getRedirectRecord`, `listQRRecords`, `listAllNames` (QR + redirect keys for uniqueness), `cascadeDeleteQRRecord`.
- `src/lib/qr/content.ts` — 10 content types → payload string serializers (`contentToValue`).
- `src/lib/qr/style.ts` — serializable `QRStyle` ↔ qr-code-styling options (`styleToOptions`).
- `src/components/Studio.tsx` — shared generator (content + style + preview + download + optional name/save block).
- `src/lib/qr/name.ts` — slug validation, adjective/animal word lists, `generateCodeName`.

## Critical gotchas

- **Solid, not React.** Never destructure props (`const { x } = props`) — it snapshots the value and breaks reactivity. Always read `props.x` in JSX or via `() => props.x`. Use `<Show>`/`For`. UI bugs from this have happened before (content-type tabs, style controls).
- **pnpm 11**: build-script approval lives in `pnpm-workspace.yaml` under `allowBuilds` (`@tailwindcss/oxide`, `esbuild`). The old `pnpm.onlyBuiltDependencies` is ignored. Don't remove `allowBuilds` or installs fail with `ERR_PNPM_IGNORED_BUILDS`.
- **PDS rejects floats in records** (unknown-collection validator accepts only integer numbers). `style.imageSize` is stored as an integer percent (40 = 40%), converted to a 0–1 coefficient in `styleToOptions` (also tolerates legacy 0.4 values). Never put float fields in records.
- **`@atcute/oauth-browser-client` is patched** (`patches/`, registered in `pnpm-workspace.yaml` under `patchedDependencies`). The patch makes DPoP nonce retry detect `use_dpop_nonce` from the JSON body, because browsers can't read `WWW-Authenticate` over CORS. If you bump this package, re-apply/re-test the patch.
- **No `start` script in package.json.** Deliberate: Railway's Railpack uses Caddy to serve `dist` only when there's no custom start command. Keep it that way; `dev`/`build`/`preview` are the scripts.
- **Dev OAuth** uses the loopback client (`http://localhost?redirect_uri=http://127.0.0.1:3000/oauth/callback...`); vite must stay on `127.0.0.1:3000` (`server.host` in `vite.config.ts`). Prod metadata: `https://atproto-qr.app/oauth-client-metadata.json` (served from `public/`).
- **Public page redirects instantly** for URL-type codes (`window.location.assign`) — no interstitial, no countdown.
- Save/rename use the authed client (`agent` from auth store); public reads use `publicClient(pdsUrl)` after `resolveHandle`.

## Deployment

Railway + GitHub. Railpack auto-detects the Vite SPA and serves `dist/` via Caddy (gzip/zstd, SPA fallback, `/health`). No Dockerfile, no Caddyfile. Domain: `atproto-qr.app`.