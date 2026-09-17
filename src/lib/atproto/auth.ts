import { createSignal } from 'solid-js';
import {
  configureOAuth,
  createAuthorizationUrl,
  finalizeAuthorization,
  getSession,
  listStoredSessions,
  deleteStoredSession,
  OAuthUserAgent,
} from '@atcute/oauth-browser-client';
import { Client, simpleFetchHandler } from '@atcute/client';
import {
  CompositeDidDocumentResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  XrpcHandleResolver,
} from '@atcute/identity-resolver';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import type {} from '@atcute/atproto';
import type {} from '@atcute/bluesky';

export const SCOPE = 'atproto transition:generic';

const DEV_REDIRECT_URI = 'http://127.0.0.1:3000/oauth/callback';
const PROD_CLIENT_ID = 'https://atproto-qr.app/oauth-client-metadata.json';
const PROD_REDIRECT_URI = 'https://atproto-qr.app/oauth/callback';

export const CLIENT_ID = import.meta.env.DEV
  ? `http://localhost?redirect_uri=${encodeURIComponent(DEV_REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`
  : PROD_CLIENT_ID;
export const REDIRECT_URI = import.meta.env.DEV ? DEV_REDIRECT_URI : PROD_REDIRECT_URI;

export const identityResolver = new LocalActorResolver({
  handleResolver: new XrpcHandleResolver({ serviceUrl: 'https://public.api.bsky.app' }),
  didDocumentResolver: new CompositeDidDocumentResolver({
    methods: {
      plc: new PlcDidDocumentResolver(),
      web: new WebDidDocumentResolver(),
    },
  }),
});

configureOAuth({
  metadata: { client_id: CLIENT_ID, redirect_uri: REDIRECT_URI },
  identityResolver,
});

export const appview = new Client({
  handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }),
});

export interface SessionProfile {
  did: Did;
  handle: string;
  displayName: string | null;
  avatar: string | null;
}

export const [authReady, setAuthReady] = createSignal(false);
export const [profile, setProfile] = createSignal<SessionProfile | null>(null);
export const [agent, setAgent] = createSignal<OAuthUserAgent | null>(null);

export async function fetchProfile(did: Did): Promise<SessionProfile> {
  const res = await appview.get('app.bsky.actor.getProfile', { params: { actor: did } });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to fetch profile');
  }
  return {
    did,
    handle: res.data.handle,
    displayName: res.data.displayName ?? null,
    avatar: res.data.avatar ?? null,
  };
}

export async function initAuth(): Promise<void> {
  try {
    const dids = listStoredSessions();
    if (dids.length > 0) {
      const session = await getSession(dids[0]);
      setAgent(new OAuthUserAgent(session));
      setProfile(await fetchProfile(session.info.sub));
    }
  } catch (err) {
    console.warn('failed to restore session:', err);
  } finally {
    setAuthReady(true);
  }
}

export async function signIn(identifier: string): Promise<void> {
  const url = await createAuthorizationUrl({
    target: { type: 'account', identifier: identifier as ActorIdentifier },
    scope: SCOPE,
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
  window.location.assign(url.toString());
}

export async function finalizeOAuthCallback(): Promise<SessionProfile> {
  const params = new URLSearchParams(
    (location.hash && location.hash.slice(1)) || (location.search && location.search.slice(1)),
  );
  history.replaceState(null, '', location.pathname + location.search);

  const { session } = await finalizeAuthorization(params);
  const userAgent = new OAuthUserAgent(session);
  setAgent(userAgent);
  const p = await fetchProfile(session.info.sub);
  setProfile(p);
  return p;
}

export async function signOut(): Promise<void> {
  const a = agent();
  if (a) {
    const sub = a.sub;
    try {
      await a.signOut();
    } catch {
      // session may already be gone
    }
    deleteStoredSession(sub);
  }
  setAgent(null);
  setProfile(null);
}