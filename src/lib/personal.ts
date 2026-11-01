import { createSignal, untrack } from 'solid-js';

import { APP_ORIGIN } from './appOrigin';
import { isValidSlug } from './qr/name';

/**
 * "Personal instance" mode: the whole deployment is pinned to a single atproto
 * account and serves that account's codes under short hash links
 * (`https://qr.example.com/#name`) instead of `/{handle}/{name}`.
 *
 * Enabled by setting `VITE_OWNER_HANDLE`. Unset = the regular multi-user app.
 */
export const OWNER_HANDLE = (import.meta.env.VITE_OWNER_HANDLE ?? '').trim().toLowerCase();
export const PERSONAL_MODE = OWNER_HANDLE !== '';

/**
 * Where visitors of a personal instance go when they sign in with another
 * account: the shared public deployment. Hardcoded on purpose — the hand-off
 * is always to atproto-qr.app, so self-hosters have one less variable.
 */
export const MAIN_ORIGIN = 'https://atproto-qr.app';

/**
 * The hand-off target for non-owner sign-ins, or `''` when there is none.
 * Guarded against pointing at this very origin (that would loop).
 */
export const HANDOFF_ORIGIN = PERSONAL_MODE && MAIN_ORIGIN !== location.origin ? MAIN_ORIGIN : '';

export interface CodeTarget {
  id: string;
  edit: boolean;
}

/**
 * The one place code URLs are built.
 *
 * In-app links (`codePath`) stay root-relative — `/#gg27` — because a bare
 * `#gg27` would resolve against whatever path you're on.
 *
 * The URL we bake into a QR code (`codeUrl`) drops the slash: browsers parse
 * `https://qr.zanca.dev#gg27` as path `/` + fragment, so it costs one character
 * less for exactly the same destination, and fewer characters make a smaller QR.
 */
export function codePath(handle: string, name: string, opts: { edit?: boolean } = {}): string {
  const suffix = opts.edit ? '/edit' : '';
  if (PERSONAL_MODE) {
    return `/#${name}${suffix}`;
  }
  return `/${handle}/${name}${suffix}`;
}

export function codeUrl(handle: string, name: string): string {
  if (PERSONAL_MODE) {
    return `${APP_ORIGIN}#${name}`;
  }
  return `${APP_ORIGIN}${codePath(handle, name)}`;
}

/** Parses `#name` / `#name/edit` into a code target. Anything else is not a code. */
export function parseCodeHash(hash: string): CodeTarget | null {
  const raw = hash.replace(/^#/, '').replace(/\/+$/, '');
  if (!raw) return null;
  const [id, ...rest] = raw.split('/');
  if (!id || !isValidSlug(id)) return null;
  if (rest.length === 0) return { id, edit: false };
  if (rest.length === 1 && rest[0] === 'edit') return { id, edit: true };
  return null;
}

function readInitialTarget(): CodeTarget | null {
  if (!PERSONAL_MODE) return null;
  if (location.pathname !== '/') return null;
  return parseCodeHash(location.hash);
}

/**
 * What the URL hash currently points at. Read by the `/` route, which swaps the
 * studio for the public page / editor while the path stays `/`.
 */
export const [hashTarget, setHashTarget] = createSignal<CodeTarget | null>(readInitialTarget());

/** Re-read the hash after router navigations, address-bar edits and back/forward. */
export function syncHashTarget(): void {
  if (!PERSONAL_MODE) return;
  const next = location.pathname === '/' ? parseCodeHash(location.hash) : null;
  const prev = untrack(hashTarget);
  if (prev === next) return;
  // Keep the existing object when nothing meaningful changed, so observer-driven
  // re-syncs don't remount the code view.
  if (prev && next && prev.id === next.id && prev.edit === next.edit) return;
  setHashTarget(next);
}
