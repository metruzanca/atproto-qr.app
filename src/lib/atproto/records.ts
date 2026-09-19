import { Client, simpleFetchHandler } from '@atcute/client';
import type { OAuthUserAgent } from '@atcute/oauth-browser-client';
import type { ActorIdentifier } from '@atcute/lexicons';

import type { BlobRef } from '../qr/content';
import type { QRRecord } from '../qr/record';
import { isValidTrackingConfig, type TrackingConfig } from '../qr/tracking';

export const COLLECTION = 'app.atproto-qr.qr';
export const REDIRECT_COLLECTION = 'app.atproto-qr.redirect';
export const SETTINGS_COLLECTION = 'app.atproto-qr.settings';
export const SETTINGS_RKEY = 'preferences';

export const REDIRECT_NOTE =
  'DO NOT DELETE — this record keeps previously printed QR codes working. Deleting it will break the URL it was printed under.';

export function authedClient(agent: OAuthUserAgent): Client {
  return new Client({ handler: agent });
}

export function publicClient(service: string): Client {
  return new Client({ handler: simpleFetchHandler({ service }) });
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  size: number;
  blob: BlobRef;
}

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  zip: 'application/zip',
  gz: 'application/gzip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function guessMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

export async function uploadFile(agent: OAuthUserAgent, file: File): Promise<UploadedFile> {
  const client = authedClient(agent);
  const mimeType = guessMimeType(file);
  const res = await client.post('com.atproto.repo.uploadBlob', {
    input: file,
    headers: { 'content-type': mimeType },
  });
  if (!res.ok) {
    throw new Error(res.data.message ?? res.data.error ?? 'failed to upload file');
  }
  const blob = res.data.blob;
  return { name: file.name, mimeType: blob.mimeType, size: blob.size, blob };
}

export class QRNameTakenError extends Error {
  constructor() {
    super('That name is already taken');
    this.name = 'QRNameTakenError';
  }
}

export async function createQRRecord(
  client: Client,
  repo: string,
  rkey: string,
  record: QRRecord,
): Promise<void> {
  const res = await client.post('com.atproto.repo.createRecord', {
    input: {
      repo: repo as ActorIdentifier,
      collection: COLLECTION,
      rkey,
      record: record as unknown as Record<string, unknown>,
    },
  });
  if (!res.ok) {
    const error = res.data.error ?? '';
    const message = res.data.message ?? '';
    if (error === 'InvalidRequest' && /already exist/i.test(message)) {
      throw new QRNameTakenError();
    }
    throw new Error(message || error || 'failed to create record');
  }
}

export async function putQRRecord(
  client: Client,
  repo: string,
  rkey: string,
  record: QRRecord,
): Promise<void> {
  const res = await client.post('com.atproto.repo.putRecord', {
    input: {
      repo: repo as ActorIdentifier,
      collection: COLLECTION,
      rkey,
      record: record as unknown as Record<string, unknown>,
    },
  });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to save record');
  }
}

export interface RedirectRecord {
  $type: typeof REDIRECT_COLLECTION;
  target: string;
  note: string;
  createdAt: string;
}

export async function putRedirectRecord(
  client: Client,
  repo: string,
  rkey: string,
  target: string,
): Promise<void> {
  const record: RedirectRecord = {
    $type: REDIRECT_COLLECTION,
    target,
    note: REDIRECT_NOTE,
    createdAt: new Date().toISOString(),
  };
  const res = await client.post('com.atproto.repo.putRecord', {
    input: {
      repo: repo as ActorIdentifier,
      collection: REDIRECT_COLLECTION,
      rkey,
      record: record as unknown as Record<string, unknown>,
    },
  });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to save redirect');
  }
}

export type ThemeSetting = 'light' | 'dark' | 'system';

export interface SettingsRecord {
  $type: typeof SETTINGS_COLLECTION;
  theme: ThemeSetting;
  analytics?: TrackingConfig;
  imageProxy?: string;
  updatedAt: string;
}

export async function getSettingsRecord(pdsUrl: string, repo: string): Promise<SettingsRecord | null> {
  const client = publicClient(pdsUrl);
  const res = await client.get('com.atproto.repo.getRecord', {
    params: { repo: repo as ActorIdentifier, collection: SETTINGS_COLLECTION, rkey: SETTINGS_RKEY },
  });
  if (!res.ok) {
    return null;
  }
  const value = res.data.value as unknown as SettingsRecord;
  if (value && (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system')) {
    return value;
  }
  return null;
}

export async function getGlobalAnalytics(pdsUrl: string, repo: string): Promise<TrackingConfig | undefined> {
  const client = publicClient(pdsUrl);
  const res = await client.get('com.atproto.repo.getRecord', {
    params: { repo: repo as ActorIdentifier, collection: SETTINGS_COLLECTION, rkey: SETTINGS_RKEY },
  });
  if (!res.ok) {
    return undefined;
  }
  const value = res.data.value as unknown as { analytics?: unknown };
  return value && isValidTrackingConfig(value.analytics) ? value.analytics : undefined;
}

export async function putSettingsRecord(client: Client, repo: string, record: SettingsRecord): Promise<void> {
  const res = await client.post('com.atproto.repo.putRecord', {
    input: {
      repo: repo as ActorIdentifier,
      collection: SETTINGS_COLLECTION,
      rkey: SETTINGS_RKEY,
      record: record as unknown as Record<string, unknown>,
    },
  });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to save settings');
  }
}

export async function cascadeDeleteQRRecord(
  client: Client,
  repo: string,
  rkey: string,
  aliases: string[],
): Promise<void> {
  const keys = [rkey, ...aliases];
  for (const key of keys) {
    const collection = key === rkey ? COLLECTION : REDIRECT_COLLECTION;
    const res = await client.post('com.atproto.repo.deleteRecord', {
      input: { repo: repo as ActorIdentifier, collection, rkey: key },
    });
    if (!res.ok) {
      const message = res.data.message ?? '';
      if (!/not found|does not exist|notfound/i.test(message)) {
        throw new Error(message || (res.data.error ?? 'failed to delete record'));
      }
    }
  }
}

export async function getRedirectRecord(
  pdsUrl: string,
  repo: string,
  rkey: string,
): Promise<RedirectRecord | null> {
  const client = publicClient(pdsUrl);
  const res = await client.get('com.atproto.repo.getRecord', {
    params: { repo: repo as ActorIdentifier, collection: REDIRECT_COLLECTION, rkey },
  });
  if (!res.ok) {
    return null;
  }
  return res.data.value as unknown as RedirectRecord;
}

export interface RedirectItem {
  rkey: string;
  target: string;
  createdAt: string;
}

export async function deleteRedirectRecord(client: Client, repo: string, rkey: string): Promise<void> {
  const res = await client.post('com.atproto.repo.deleteRecord', {
    input: { repo: repo as ActorIdentifier, collection: REDIRECT_COLLECTION, rkey },
  });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to delete redirect');
  }
}

export async function listRedirectRecords(client: Client, repo: string): Promise<RedirectItem[]> {
  const items: RedirectItem[] = [];
  let cursor: string | undefined;
  for (;;) {
    const res = await client.get('com.atproto.repo.listRecords', {
      params: {
        repo: repo as ActorIdentifier,
        collection: REDIRECT_COLLECTION,
        limit: 100,
        cursor,
      },
    });
    if (!res.ok) {
      throw new Error(res.data.error ?? 'failed to list redirects');
    }
    for (const record of res.data.records) {
      const rkey = record.uri.split('/').pop();
      const value = record.value as unknown as RedirectRecord;
      if (rkey && value && typeof value.target === 'string') {
        items.push({ rkey, target: value.target, createdAt: value.createdAt ?? '' });
      }
    }
    cursor = res.data.cursor;
    if (!cursor || res.data.records.length === 0) break;
  }
  return items;
}

export interface QRRecordItem {
  rkey: string;
  record: QRRecord;
  uri: string;
}

export async function getQRRecord(pdsUrl: string, repo: string, rkey: string): Promise<QRRecordItem | null> {
  const client = publicClient(pdsUrl);
  const res = await client.get('com.atproto.repo.getRecord', {
    params: { repo: repo as ActorIdentifier, collection: COLLECTION, rkey },
  });
  if (!res.ok) {
    return null;
  }
  return {
    rkey,
    uri: res.data.uri,
    record: res.data.value as unknown as QRRecord,
  };
}

export async function listRedirectRecordKeys(client: Client, repo: string): Promise<string[]> {
  return listCollectionKeys(client, repo, REDIRECT_COLLECTION);
}

export async function listAllNames(client: Client, repo: string): Promise<string[]> {
  const [qr, redirects] = await Promise.all([
    listCollectionKeys(client, repo, COLLECTION),
    listCollectionKeys(client, repo, REDIRECT_COLLECTION),
  ]);
  return [...qr, ...redirects];
}

async function listCollectionKeys(client: Client, repo: string, collection: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  for (;;) {
    const res = await client.get('com.atproto.repo.listRecords', {
      params: {
        repo: repo as ActorIdentifier,
        collection: collection as `${string}.${string}.${string}`,
        limit: 100,
        cursor,
      },
    });
    if (!res.ok) {
      throw new Error(res.data.error ?? 'failed to list records');
    }
    for (const record of res.data.records) {
      const rkey = record.uri.split('/').pop();
      if (rkey) {
        keys.push(rkey);
      }
    }
    cursor = res.data.cursor;
    if (!cursor || res.data.records.length === 0) break;
  }
  return keys;
}

export async function listQRRecords(client: Client, repo: string): Promise<QRRecordItem[]> {
  const items: QRRecordItem[] = [];
  let cursor: string | undefined;
  for (;;) {
    const res = await client.get('com.atproto.repo.listRecords', {
      params: { repo: repo as ActorIdentifier, collection: COLLECTION, limit: 100, cursor },
    });
    if (!res.ok) {
      throw new Error(res.data.error ?? 'failed to list records');
    }
    for (const record of res.data.records) {
      const rkey = record.uri.split('/').pop();
      if (rkey) {
        items.push({ rkey, uri: record.uri, record: record.value as unknown as QRRecord });
      }
    }
    cursor = res.data.cursor;
    if (!cursor || res.data.records.length === 0) break;
  }
  return items;
}