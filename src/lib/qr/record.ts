import type { Content } from './content';
import type { QRStyle } from './style';

export const COLLECTION = 'app.atproto-qr.qr';

export interface QRRecord {
  $type: typeof COLLECTION;
  content: Content;
  style: QRStyle;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  content: Content;
  style: QRStyle;
}

export function makeRecord(draft: Draft, existing?: QRRecord): QRRecord {
  const now = new Date().toISOString();
  return {
    $type: COLLECTION,
    content: draft.content,
    style: draft.style,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function isValidRecord(value: unknown): value is QRRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.$type === COLLECTION &&
    typeof v.content === 'object' &&
    v.content !== null &&
    typeof (v.content as { type?: unknown }).type === 'string' &&
    typeof v.style === 'object' &&
    v.style !== null
  );
}