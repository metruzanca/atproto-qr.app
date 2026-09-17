import { contentToValue, type Content } from './content';
import type { QRStyle } from './style';

export const COLLECTION = 'app.atproto-qr.qr';

export type QRKind = 'fixed' | 'dynamic';

export interface QRRecord {
  $type: typeof COLLECTION;
  kind: QRKind;
  content: Content;
  style: QRStyle;
  qrValue?: string;
  createdAt: string;
  updatedAt: string;
  aliases?: string[];
}

export interface Draft {
  content: Content;
  style: QRStyle;
}

export function makeRecord(draft: Draft, existing?: QRRecord): QRRecord {
  const now = new Date().toISOString();
  return {
    $type: COLLECTION,
    kind: existing?.kind ?? 'fixed',
    content: draft.content,
    style: draft.style,
    qrValue: existing?.qrValue,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    aliases: existing?.aliases ?? [],
  };
}

export function qrValueFor(record: QRRecord, fallback?: string): string {
  if (record.kind === 'dynamic') {
    return record.qrValue ?? fallback ?? '';
  }
  return contentToValue(record.content);
}

export function isValidRecord(value: unknown): value is QRRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.$type === COLLECTION &&
    (v.kind === undefined || v.kind === 'fixed' || v.kind === 'dynamic') &&
    typeof v.content === 'object' &&
    v.content !== null &&
    typeof (v.content as { type?: unknown }).type === 'string' &&
    typeof v.style === 'object' &&
    v.style !== null
  );
}