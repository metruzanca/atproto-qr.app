/**
 * Origin helpers shared by the app bundle and `vite.config.ts` (which runs in
 * Node), so the runtime OAuth URLs and the generated client metadata can never
 * disagree. Keep this module free of `location` and `import.meta.env`.
 */

/**
 * Where the canonical deployment lives. Used when `VITE_DOMAIN` is unset, so
 * `atproto-qr.app` keeps working (links, OAuth metadata, redirect URI) even if
 * the host forgets the variable. Self-hosted copies set `VITE_DOMAIN`.
 */
export const DEFAULT_APP_ORIGIN = 'https://atproto-qr.app';

/** `qr.example.com` or `https://qr.example.com` → `https://qr.example.com`. Empty when unusable. */
export function normalizeOrigin(value: string | undefined): string {
  const raw = (value ?? '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return '';
  }
}
