import { Client, simpleFetchHandler } from '@atcute/client';
import type { OAuthUserAgent } from '@atcute/oauth-browser-client';
import type { ActorIdentifier } from '@atcute/lexicons';

import type { QRRecord } from '../qr/record';

export const COLLECTION = 'app.atproto-qr.qr';

export function authedClient(agent: OAuthUserAgent): Client {
  return new Client({ handler: agent });
}

export function publicClient(service: string): Client {
  return new Client({ handler: simpleFetchHandler({ service }) });
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

export async function deleteQRRecord(client: Client, repo: string, rkey: string): Promise<void> {
  const res = await client.post('com.atproto.repo.deleteRecord', {
    input: { repo: repo as ActorIdentifier, collection: COLLECTION, rkey },
  });
  if (!res.ok) {
    throw new Error(res.data.error ?? 'failed to delete record');
  }
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