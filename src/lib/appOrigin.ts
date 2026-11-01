/**
 * Where this deployment is actually served — the origin we bake into QR codes
 * and show as "this code's link".
 *
 * Deriving it from the page is wrong in dev and preview deploys (codes would
 * encode `http://127.0.0.1:3000/...`), so `VITE_DOMAIN` pins it explicitly:
 *
 *   VITE_DOMAIN=qr.zanca.dev            # or https://qr.zanca.dev
 *
 * It is also what the OAuth client metadata and redirect URI are derived from,
 * so a deployment only ever needs this one variable. Unset (dev), it falls back
 * to the page's own origin.
 */

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

const configured = normalizeOrigin(import.meta.env.VITE_DOMAIN);

/** Absolute origin codes point at, e.g. `https://qr.zanca.dev`. */
export const APP_ORIGIN = configured || location.origin;

/** Host only, e.g. `qr.zanca.dev` — for copy and length comparisons. */
export const APP_HOST = new URL(APP_ORIGIN).host;
