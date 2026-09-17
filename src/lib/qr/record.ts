import { contentToValue, CONTENT_TYPES, type Content, type ContentType } from './content';
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

export function draftToParam(draft: Draft): string {
  return JSON.stringify({ content: draft.content, style: draft.style });
}

export function draftFromParam(value: string): Draft | null {
  try {
    const raw: unknown = JSON.parse(value);
    if (typeof raw !== 'object' || raw === null) return null;
    const { content, style } = raw as { content?: unknown; style?: unknown };
    if (typeof content !== 'object' || content === null) return null;
    const { type, fields } = content as { type?: unknown; fields?: unknown };
    if (typeof type !== 'string' || !CONTENT_TYPES.some((t) => t.type === type)) return null;
    if (typeof fields !== 'object' || fields === null) return null;
    return {
      content: { type: type as ContentType, fields: { ...(fields as Record<string, unknown>) } },
      style: normalizeStyle(style),
    };
  } catch {
    return null;
  }
}

function normalizeStyle(style: unknown): QRStyle {
  const out: QRStyle = { ...DEFAULT_STYLE };
  if (typeof style !== 'object' || style === null) return out;
  const s = style as Record<string, unknown>;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

  const size = num(s.size);
  if (size !== undefined) out.size = size;
  if (s.shape === 'square' || s.shape === 'circle') out.shape = s.shape;
  const dotsType = str(s.dotsType);
  if (dotsType !== undefined) out.dotsType = dotsType;
  const dotsColor = str(s.dotsColor);
  if (dotsColor !== undefined) out.dotsColor = dotsColor;
  if (s.cornersSquareType === null || str(s.cornersSquareType) !== undefined)
    out.cornersSquareType = s.cornersSquareType as string | null;
  if (s.cornersSquareColor === null || str(s.cornersSquareColor) !== undefined)
    out.cornersSquareColor = s.cornersSquareColor as string | null;
  if (s.cornersDotType === null || str(s.cornersDotType) !== undefined)
    out.cornersDotType = s.cornersDotType as string | null;
  if (s.cornersDotColor === null || str(s.cornersDotColor) !== undefined)
    out.cornersDotColor = s.cornersDotColor as string | null;
  const backgroundColor = str(s.backgroundColor);
  if (backgroundColor !== undefined) out.backgroundColor = backgroundColor;
  const backgroundMargin = num(s.backgroundMargin);
  if (backgroundMargin !== undefined) out.backgroundMargin = backgroundMargin;
  if (s.image === null || str(s.image) !== undefined) out.image = s.image as string | null;
  const imageMargin = num(s.imageMargin);
  if (imageMargin !== undefined) out.imageMargin = imageMargin;
  const imageSize = num(s.imageSize);
  if (imageSize !== undefined) out.imageSize = imageSize;
  if (
    s.errorCorrectionLevel === 'L' ||
    s.errorCorrectionLevel === 'M' ||
    s.errorCorrectionLevel === 'Q' ||
    s.errorCorrectionLevel === 'H'
  ) {
    out.errorCorrectionLevel = s.errorCorrectionLevel;
  }
  return out;
}