# UI Redesign Plan — "Glacier Blue"

## Goal

Give atproto-qr.app a full visual facelift — sleeker, prettier, with motion — without
removing or changing any features. On the home page, the "Ideas for your next code"
guide must not appear on the first screen; the QR editor owns the fold.

## Design direction: Glacier Blue

Frosted-glass surfaces, cyan→blue gradients, Geist-style minimalism, generous
whitespace. Bluesky-adjacent but refined. Full creative freedom over colors, icons,
fonts.

## Constraints (hard rules)

- **Zero features removed, zero logic changes** — only classes, design tokens, and
  additive structure (anchors, wrappers, icons). Solid reactivity patterns untouched.
- Solid, not React: never destructure props; keep `<Show>`/`<For>` usage.
- Respect AGENTS.md gotchas: no `start` script in package.json, keep
  `allowBuilds` in `pnpm-workspace.yaml`, vite stays on `127.0.0.1:3000`, no floats in
  records (irrelevant here but don't touch record code).
- All custom animation disabled under `prefers-reduced-motion`.

## Foundation (`src/index.css` + fonts)

- **Fonts:** Geist Sans (UI + display) + Geist Mono, self-hosted via Fontsource
  (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`) — no third-party
  font requests, matching the app's privacy ethos. Imported in `src/index.tsx`.
- **Tailwind v4 `@theme` tokens:** `--font-sans`/`--font-mono`, and `--animate-*`
  keyframes (fade-up, fade-in, scale-in, pop-in, toast-in, bounce-soft, float).
- **Palette:**
  - Light: icy `#f4f7fc` background, `white/75` frosted surfaces, `slate-200/80`
    hairlines.
  - Dark: deep blue-black `#060a13`, `white/[0.045]` glass surfaces, `white/10`
    hairlines.
  - Accent: sky-500 → blue-600 gradient for primary actions + hero keyword
    (`.text-gradient`).
  - Semantic hues kept: violet = dynamic, amber = redirect/warning, emerald = tips,
    red = destructive.
- **Component classes** via `@layer components` so markup diffs stay small and every
  page inherits the look consistently:
  - `.card` (frosted surface, soft diffused shadow, backdrop-blur) + `.card-hover`
    (lift + sky border on hover)
  - `.btn-primary` (gradient, glow shadow, hover-lift, press-down), `.btn-secondary`
    (frosted ghost), `.btn-danger`, `.btn-ghost`
  - `.badge`, `.section-label`, `.text-gradient`, `.hairline`
  - `.qr-stage` (dotted-grid backdrop for the QR preview), `.bg-mesh` (fixed radial
    gradient decoration behind the app)
  - `.reveal` / `.is-visible` (scroll-reveal), `.collapsible` (grid-rows 0fr→1fr
    expand/collapse animation)
- Base polish: selection color, subtle scrollbar styling, sky `:focus-visible` ring,
  `scroll-behavior: smooth`, `index.html` theme-color `#f4f7fc`.

## Motion

- Staggered fade-up entrance on the home hero + studio (`animate-fade-up delay-150`).
- New `src/components/Reveal.tsx`: IntersectionObserver wrapper adding `.is-visible`,
  applied to UsageGuide sections.
- Micro-interactions: button hover-lift/press, card hover-lift, ThemeMenu dropdown and
  ConfirmDialog pop-in, Toast slide-up, About disclosure fade on open, Style section
  animated expand/collapse via `.collapsible`, bouncing scroll cue.
- QR preview scales in on first render.

## Home fold (key requirement)

- Compact hero: one-line headline with gradient keyword, short sub, tighter padding,
  and a "Need inspiration? See ideas & tips ↓" anchor link.
- Wrap hero + Studio in `min-h-[calc(100svh-6.5rem)]` so the guide always starts below
  the first screen.
- UsageGuide gets `id="ideas"`, `scroll-mt-20`, a hairline top divider, and eyebrow
  labels ("Inspiration", "Decision guide", "Real-world advice").

## File-by-file facelift

| Area | Changes |
|---|---|
| `index.css` | tokens, keyframes, component classes (above) |
| `index.html` / `index.tsx` | theme-color; Fontsource imports |
| `ui.tsx` | frosted inputs w/ sky focus ring, pill Segmented, gradient Toggle, custom Select chevron |
| `Header.tsx` | **sticky** frosted-glass bar, gradient logo tile, pill nav with active-route state, gradient Sign-in, avatar ring |
| `App.tsx` | new bg colors + `.bg-mesh` fixed decoration, slimmer footer with hairline |
| `Studio.tsx` | `.card` sections with icon-chip `SectionHeader`s, `.qr-stage` preview with glow + white QR frame, gradient download/save buttons, accent radios, restyled lock overlay + dynamic explainer |
| `QRPreview.tsx` | entrance scale-in; dashed empty-state with icon — restructured so the empty state is a **sibling** of the QR container (pre-existing bug: `textContent=''` wiped the Solid-managed node) |
| `ContentFields` / `StyleControls` / `TrackingConfigFields` | inherit new primitives; nested panels (logo, proxy, file upload) restyled |
| `Home.tsx` | compact hero, scroll cue, fold wrapper |
| `UsageGuide.tsx` | `#ideas` anchor, Reveal animations, `.card card-hover` cards, refreshed Fixed/Dynamic panels |
| `Mine.tsx` | frosted list cards, `.badge` chips, count line, gradient "+ New", `.btn-ghost` row actions |
| `Editor.tsx` | header block, badges, amber-glass redirect notice, `.btn-danger` delete |
| `Login.tsx` | centered frosted card with gradient glow, frosted suggestions dropdown, gradient submit |
| `Settings.tsx` | `.card` sections, accent radios/checkboxes, `.btn-primary`/`.btn-danger` |
| `About.tsx` | gradient hero text, `.card` disclosures with fade on open, sky-glass PDS panel |
| `Lexicons.tsx` | tables/code blocks to new tokens |
| `QRPublic.tsx` | `.card`, badges, `.qr-stage` QR frame, frosted file/data panels |
| `Callback.tsx` | spinner + link tokens |
| `Toast.tsx` | glass pill with check icon + `toast-in` animation |
| `ConfirmDialog.tsx` | blurred backdrop fade + pop-in card |
| `ThemeMenu.tsx` | frosted pop-in dropdown, active item highlight |

**New file:** `src/components/Reveal.tsx`.
**New deps:** the two Fontsource packages only — no other libraries.

## Verification

1. `pnpm install` (font packages)
2. `pnpm exec tsc --noEmit`
3. `pnpm build`
4. Visual smoke test via headless Chromium (screenshots): `/`, `/about`, `/login`,
   `/codes` in light + dark; mobile 390px viewport; scroll-reveal behavior; filled QR
   preview; Style expand; dynamic-mode anonymous state.

## Risks found during implementation (documented for the record)

- QRPreview empty-state wipe (fixed: sibling structure).
- Mobile grid blowout ~30px (fixed: `grid grid-cols-1 ... lg:grid-cols-2` + `min-w-0`
  on both Studio columns).

## Follow-ups

- Update AGENTS.md: Stack (fonts + design system), Key source files (Reveal.tsx),
  Critical gotchas (never `textContent=''` Solid-managed DOM), Routes (home fold
  wrapper).