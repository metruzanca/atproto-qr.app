import { contentToValue, CONTENT_TYPES, defaultFields, type Content, type ContentType } from './content';
import { DEFAULT_STYLE, type QRStyle } from './style';

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

export function draftToParams(draft: Draft): URLSearchParams {
  const params = new URLSearchParams();
  const { type, fields } = draft.content;
  const defaults = defaultFields(type);

  if (type !== 'url') {
    params.set('t', type);
  }

  for (const key of Object.keys(defaults)) {
    const value = fields[key] ?? defaults[key];
    if (value !== defaults[key]) {
      params.set(key, String(value));
    }
  }

  for (const key of Object.keys(DEFAULT_STYLE) as (keyof QRStyle)[]) {
    if (draft.style[key] !== DEFAULT_STYLE[key]) {
      params.set(key, String(draft.style[key]));
    }
  }

  return params;
}

export function draftFromParams(params: URLSearchParams): Draft | null {
  const type = (params.get('t') ?? 'url') as ContentType;
  if (!CONTENT_TYPES.some((c) => c.type === type)) return null;

  const defaults = defaultFields(type);
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) {
    const raw = params.get(key);
    fields[key] = raw === null ? defaults[key] : coerceValue(defaults[key], raw);
  }

  const style: QRStyle = { ...DEFAULT_STYLE };
  const styleRecord = style as unknown as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_STYLE)) {
    const raw = params.get(key);
    if (raw !== null) {
      styleRecord[key] = coerceValue(style[key as keyof QRStyle], raw);
    }
  }

  return { content: { type, fields }, style };
}

function coerceValue(defaultValue: unknown, raw: string): unknown {
  if (typeof defaultValue === 'boolean') return raw === 'true';
  if (typeof defaultValue === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : defaultValue;
  }
  return raw;
}