import { createEffect, createRoot, createSignal } from 'solid-js';
import type { OAuthUserAgent } from '@atcute/oauth-browser-client';

import { agent, profile } from '../atproto/auth';
import {
  authedClient,
  getSettingsRecord,
  putSettingsRecord,
  SETTINGS_COLLECTION,
  type SettingsRecord,
} from '../atproto/records';
import { defaultProxyOrigin } from './style';

export const [globalImageProxyUrl, setGlobalImageProxyUrl] = createSignal<string | undefined>(undefined);

createRoot(() => {
  let loadedDid: string | null = null;
  createEffect(() => {
    const p = profile();
    const a = agent();
    if (!p || !a) return;
    if (loadedDid === p.did) return;
    loadedDid = p.did;
    void (async () => {
      try {
        const rec = await getSettingsRecord(a.session.info.aud, p.did);
        setGlobalImageProxyUrl(rec?.imageProxy ?? undefined);
      } catch (err) {
        console.warn('failed to load image proxy setting:', err);
      }
    })();
  });
});

export function resolveProxyOrigin(customUrl: string | undefined): string {
  return customUrl || globalImageProxyUrl() || defaultProxyOrigin();
}

export async function saveGlobalImageProxy(
  agentSession: OAuthUserAgent,
  did: string,
  url: string | undefined,
): Promise<void> {
  const current = await getSettingsRecord(agentSession.session.info.aud, did);
  const record: SettingsRecord = {
    $type: SETTINGS_COLLECTION,
    theme: current?.theme ?? 'system',
    analytics: current?.analytics,
    imageProxy: url,
    updatedAt: new Date().toISOString(),
  };
  await putSettingsRecord(authedClient(agentSession), did, record);
  setGlobalImageProxyUrl(url);
}