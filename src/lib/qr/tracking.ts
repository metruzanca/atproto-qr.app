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

export type TrackingConfig =
  | { provider: 'ga4'; measurementId: string; apiSecret?: string }
  | { provider: 'plausible'; domain: string; endpoint?: string }
  | { provider: 'umami'; websiteId: string; endpoint: string }
  | { provider: 'matomo'; endpoint: string; siteId: number };

export type QRCodeTracking = { source: 'global' } | { source: 'custom'; config: TrackingConfig };

export interface TrackingContext {
  url: string;
  title: string;
  referrer: string;
}

const GA_CLIENT_ID_KEY = 'atproto-qr.ga_client_id';
const MATOMO_ID_KEY = 'atproto-qr.matomo_id';

const GA_MEASUREMENT_RE = /^G-[A-Z0-9-]+$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isValidTrackingConfig(value: unknown): value is TrackingConfig {
  if (!isRecord(value)) return false;
  switch (value.provider) {
    case 'ga4':
      return (
        typeof value.measurementId === 'string' &&
        GA_MEASUREMENT_RE.test(value.measurementId) &&
        (value.apiSecret === undefined || typeof value.apiSecret === 'string')
      );
    case 'plausible':
      return (
        typeof value.domain === 'string' &&
        value.domain.length > 0 &&
        (value.endpoint === undefined || typeof value.endpoint === 'string')
      );
    case 'umami':
      return (
        typeof value.websiteId === 'string' &&
        value.websiteId.length > 0 &&
        typeof value.endpoint === 'string' &&
        value.endpoint.length > 0
      );
    case 'matomo':
      return (
        typeof value.endpoint === 'string' &&
        value.endpoint.length > 0 &&
        typeof value.siteId === 'number' &&
        Number.isInteger(value.siteId)
      );
    default:
      return false;
  }
}

export function isValidQRCodeTracking(value: unknown): value is QRCodeTracking {
  if (!isRecord(value)) return false;
  if (value.source === 'global') return true;
  if (value.source === 'custom') return isValidTrackingConfig(value.config);
  return false;
}

export function parseGtagId(snippet: string): string | null {
  const match = /G-[A-Z0-9-]+/i.exec(snippet);
  return match ? match[0] : null;
}

export function trackingConfigSummary(config: TrackingConfig): string {
  switch (config.provider) {
    case 'ga4':
      return `Google Analytics · ${config.measurementId}${config.apiSecret ? ' · API secret' : ''}`;
    case 'plausible':
      return `Plausible · ${config.domain}`;
    case 'umami':
      return `Umami · ${config.websiteId}`;
    case 'matomo':
      return `Matomo · site ${config.siteId}`;
  }
}

export const [globalAnalytics, setGlobalAnalytics] = createSignal<TrackingConfig | undefined>(undefined);

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
        setGlobalAnalytics(rec?.analytics ?? undefined);
      } catch (err) {
        console.warn('failed to load analytics setting:', err);
      }
    })();
  });
});

export async function saveGlobalAnalytics(
  agentSession: OAuthUserAgent,
  did: string,
  config: TrackingConfig | undefined,
): Promise<void> {
  const current = await getSettingsRecord(agentSession.session.info.aud, did);
  const record: SettingsRecord = {
    $type: SETTINGS_COLLECTION,
    theme: current?.theme ?? 'system',
    analytics: config,
    updatedAt: new Date().toISOString(),
  };
  await putSettingsRecord(authedClient(agentSession), did, record);
  setGlobalAnalytics(config);
}

const fired = new Set<string>();

export async function fireTracking(config: TrackingConfig, ctx: TrackingContext): Promise<void> {
  const key = `${ctx.url}|${config.provider}|${JSON.stringify(config)}`;
  if (fired.has(key)) return;
  fired.add(key);
  try {
    switch (config.provider) {
      case 'ga4':
        return config.apiSecret ? fireGa4Mp(config, ctx) : fireGa4Gtag(config, ctx);
      case 'plausible':
        return firePlausible(config, ctx);
      case 'umami':
        return fireUmami(config, ctx);
      case 'matomo':
        return fireMatomo(config, ctx);
    }
  } catch (err) {
    console.warn('analytics beacon failed:', err);
  }
}

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

function fireGa4Gtag(config: Extract<TrackingConfig, { provider: 'ga4' }>, ctx: TrackingContext): Promise<void> {
  return new Promise((resolve) => {
    const win = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    win.dataLayer = win.dataLayer ?? [];
    if (!win.gtag) {
      win.gtag = (...args: unknown[]) => win.dataLayer!.push(args);
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
      window.setTimeout(resolve, 400);
    } else {
      resolve();
    }
    const gtag = win.gtag;
    gtag('js', new Date());
    gtag('config', config.measurementId, {
      page_path: pathOf(ctx.url),
      page_location: ctx.url,
      page_title: ctx.title,
      page_referrer: ctx.referrer,
    });
    gtag('event', 'page_view', {
      page_title: ctx.title,
      page_location: ctx.url,
      page_referrer: ctx.referrer,
    });
  });
}

async function fireGa4Mp(config: Extract<TrackingConfig, { provider: 'ga4' }>, ctx: TrackingContext): Promise<void> {
  let clientId = '';
  try {
    clientId = localStorage.getItem(GA_CLIENT_ID_KEY) ?? '';
  } catch {
    clientId = '';
  }
  if (!clientId) {
    clientId = crypto.randomUUID();
    try {
      localStorage.setItem(GA_CLIENT_ID_KEY, clientId);
    } catch {
      // ignore storage errors
    }
  }
  const body = JSON.stringify({
    client_id: clientId,
    events: [
      {
        name: 'page_view',
        params: { page_title: ctx.title, page_location: ctx.url, page_referrer: ctx.referrer },
      },
    ],
  });
  const url =
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(config.measurementId)}` +
    `&api_secret=${encodeURIComponent(config.apiSecret ?? '')}`;
  await fetch(url, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'content-type': 'text/plain' },
  }).catch(() => {});
}

async function firePlausible(config: Extract<TrackingConfig, { provider: 'plausible' }>, ctx: TrackingContext): Promise<void> {
  const endpoint = (config.endpoint?.trim() || 'https://plausible.io').replace(/\/$/, '');
  await fetch(`${endpoint}/api/event`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({
      domain: config.domain,
      url: ctx.url,
      referrer: ctx.referrer,
      ua: navigator.userAgent,
      width: window.innerWidth,
    }),
    keepalive: true,
  }).catch(() => {});
}

async function fireUmami(config: Extract<TrackingConfig, { provider: 'umami' }>, ctx: TrackingContext): Promise<void> {
  const endpoint = config.endpoint.replace(/\/$/, '');
  let path = ctx.url;
  try {
    const u = new URL(ctx.url);
    path = u.pathname + u.search;
  } catch {
    // keep the raw url
  }
  await fetch(`${endpoint}/api/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      payload: {
        website: config.websiteId,
        hostname: window.location.hostname,
        language: navigator.language,
        referrer: ctx.referrer,
        screen: `${window.screen.width}x${window.screen.height}`,
        title: ctx.title,
        url: path,
      },
      type: 'event',
    }),
    keepalive: true,
  }).catch(() => {});
}

function matomoVisitorId(): string {
  try {
    const stored = localStorage.getItem(MATOMO_ID_KEY);
    if (stored && stored.length === 16) return stored;
  } catch {
    // ignore storage errors
  }
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    localStorage.setItem(MATOMO_ID_KEY, id);
  } catch {
    // ignore storage errors
  }
  return id;
}

async function fireMatomo(config: Extract<TrackingConfig, { provider: 'matomo' }>, ctx: TrackingContext): Promise<void> {
  const endpoint = config.endpoint.replace(/\/$/, '');
  const params = new URLSearchParams({
    idsite: String(config.siteId),
    rec: '1',
    apiv: '1',
    url: ctx.url,
    urlref: ctx.referrer,
    action_name: ctx.title,
    _id: matomoVisitorId(),
    send_image: '0',
    rand: String(Math.random()),
  });
  await fetch(`${endpoint}/matomo.php?${params.toString()}`, {
    mode: 'no-cors',
    keepalive: true,
  }).catch(() => {});
}