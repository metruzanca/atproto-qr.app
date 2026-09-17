import { Client, simpleFetchHandler } from '@atcute/client';
import type { OAuthUserAgent } from '@atcute/oauth-browser-client';
import type { ActorIdentifier } from '@atcute/lexicons';

import type { QRRecord } from '../qr/record';

export const COLLECTION = 'app.atproto-qr.qr';
export const REDIRECT_COLLECTION = 'app.atproto-qr.redirect';

export const REDIRECT_NOTE =
  'DO NOT DELETE — this record keeps previously printed QR codes working. Deleting it will break the URL it was printed under.';

export function authedClient(agent: OAuthUserAgent): Client {
  return new Client({ handler: agent });
}

export function publicClient(service: string): Client {
  return new Client({ handler: simpleFetchHandler({ service }) });
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