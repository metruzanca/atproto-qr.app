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
 * so a deployment only ever needs this one variable. Unset in a production
 * build, it falls back to `DEFAULT_APP_ORIGIN`; dev falls back to the page's
 * own origin so the loopback OAuth client keeps working.
 */

import { DEFAULT_APP_ORIGIN, normalizeOrigin } from './origin';

export { normalizeOrigin };

const configured = normalizeOrigin(import.meta.env.VITE_DOMAIN);

/** Absolute origin codes point at, e.g. `https://qr.zanca.dev`. */
export const APP_ORIGIN = configured || (import.meta.env.DEV ? location.origin : DEFAULT_APP_ORIGIN);

/** Host only, e.g. `qr.zanca.dev` — for copy and length comparisons. */
export const APP_HOST = new URL(APP_ORIGIN).host;
