import { createEffect, createRoot, createSignal } from 'solid-js';

import { agent, profile } from './atproto/auth';
import {
  authedClient,
  getSettingsRecord,
  putSettingsRecord,
  SETTINGS_COLLECTION,
  type SettingsRecord,
} from './atproto/records';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'atproto-qr.theme';

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // ignore storage errors
  }
  return 'system';
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export const [theme, setTheme] = createSignal<Theme>(readStoredTheme());

export const effectiveTheme = (): 'light' | 'dark' => {
  const t = theme();
  return t === 'system' ? (prefersDark() ? 'dark' : 'light') : t;
};

function applyTheme(): void {
  document.documentElement.classList.toggle('dark', effectiveTheme() === 'dark');
}

createRoot(() => {
  createEffect(() => {
    const t = theme();
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore storage errors
    }
    applyTheme();
  });

  let loadedDid: string | null = null;
  let loadedOk = false;
  let pushedValue: Theme | null = null;

  createEffect(() => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (loadedDid === p.did) return;
    loadedDid = p.did;
    loadedOk = false;
    void (async () => {
      try {
        const rec = await getSettingsRecord(a.session.info.aud, p.did);
        if (rec) {
          pushedValue = rec.theme;
          setTheme(rec.theme);
        } else {
          pushedValue = null;
        }
      } catch (err) {
        console.warn('failed to load theme setting:', err);
      } finally {
        loadedOk = true;
      }
    })();
  });

  createEffect(() => {
    const t = theme();
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (loadedDid !== p.did || !loadedOk) return;
    if (pushedValue === t) return;
    pushedValue = t;
    void (async () => {
      try {
        const current = await getSettingsRecord(a.session.info.aud, p.did);
        const record: SettingsRecord = {
          $type: SETTINGS_COLLECTION,
          theme: t,
          analytics: current?.analytics,
          imageProxy: current?.imageProxy,
          updatedAt: new Date().toISOString(),
        };
        await putSettingsRecord(authedClient(a), p.did, record);
      } catch (err) {
        console.warn('failed to save theme setting:', err);
        pushedValue = null;
      }
    })();
  });
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (theme() === 'system') applyTheme();
});