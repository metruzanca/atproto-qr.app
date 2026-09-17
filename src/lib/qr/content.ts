export type ContentType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'geo'
  | 'event'
  | 'crypto';

export interface Content {
  type: ContentType;
  fields: Record<string, unknown>;
}

export const CONTENT_TYPES: { type: ContentType; label: string }[] = [
  { type: 'url', label: 'URL' },
  { type: 'text', label: 'Text' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'sms', label: 'SMS' },
  { type: 'wifi', label: 'WiFi' },
  { type: 'vcard', label: 'vCard' },
  { type: 'geo', label: 'Geo' },
  { type: 'event', label: 'Event' },
  { type: 'crypto', label: 'Crypto' },
];

export function defaultFields(type: ContentType): Record<string, unknown> {
  switch (type) {
    case 'url':
      return { url: '' };
    case 'text':
      return { text: '' };
    case 'email':
      return { address: '', subject: '', body: '' };
    case 'phone':
      return { phone: '' };
    case 'sms':
      return { phone: '', message: '' };
    case 'wifi':
      return { ssid: '', password: '', encryption: 'WPA', hidden: false };
    case 'vcard':
      return { name: '', org: '', title: '', phone: '', email: '', url: '' };
    case 'geo':
      return { lat: '', lon: '' };
    case 'event':
      return { title: '', location: '', description: '', start: '', end: '' };
    case 'crypto':
      return { currency: 'bitcoin', address: '', amount: '' };
  }
}

export function emptyContent(type: ContentType): Content {
  return { type, fields: defaultFields(type) };
}

function escapeWifi(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:');
}

function toIcal(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const CRYPTO_PREFIXES: Record<string, string> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  litecoin: 'litecoin',
  dogecoin: 'dogecoin',
  monero: 'monero',
  bitcoincash: 'bitcoincash',
};

export function contentToValue(content: Content): string {
  const f = content.fields;

  switch (content.type) {
    case 'url': {
      const raw = String(f.url ?? '').trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      return `https://${raw}`;
    }
    case 'text':
      return String(f.text ?? '');
    case 'email': {
      const address = String(f.address ?? '').trim();
      const params = new URLSearchParams();
      if (f.subject) params.set('subject', String(f.subject));
      if (f.body) params.set('body', String(f.body));
      const query = params.toString();
      return `mailto:${address}${query ? `?${query}` : ''}`;
    }
    case 'phone':
      return `tel:${String(f.phone ?? '').trim()}`;
    case 'sms': {
      const phone = String(f.phone ?? '').trim();
      const message = String(f.message ?? '');
      return message ? `SMSTO:${phone}:${message}` : `sms:${phone}`;
    }
    case 'wifi': {
      const ssid = escapeWifi(String(f.ssid ?? ''));
      const password = escapeWifi(String(f.password ?? ''));
      const encryption = String(f.encryption ?? 'WPA');
      const hidden = f.hidden ? 'true' : 'false';
      return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
    }
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (f.name) lines.push(`FN:${f.name}`);
      if (f.org) lines.push(`ORG:${f.org}`);
      if (f.title) lines.push(`TITLE:${f.title}`);
      if (f.phone) lines.push(`TEL:${f.phone}`);
      if (f.email) lines.push(`EMAIL:${f.email}`);
      if (f.url) lines.push(`URL:${f.url}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'geo':
      return `geo:${String(f.lat ?? '')},${String(f.lon ?? '')}`;
    case 'event': {
      const lines = ['BEGIN:VEVENT'];
      if (f.title) lines.push(`SUMMARY:${f.title}`);
      if (f.location) lines.push(`LOCATION:${f.location}`);
      if (f.description) lines.push(`DESCRIPTION:${String(f.description).replace(/\n/g, '\\n')}`);
      const start = toIcal(String(f.start ?? ''));
      const end = toIcal(String(f.end ?? ''));
      if (start) lines.push(`DTSTART:${start}`);
      if (end) lines.push(`DTEND:${end}`);
      lines.push('END:VEVENT');
      return lines.join('\n');
    }
    case 'crypto': {
      const currency = String(f.currency ?? 'bitcoin');
      const prefix = CRYPTO_PREFIXES[currency] ?? currency;
      const address = String(f.address ?? '').trim();
      const amount = String(f.amount ?? '').trim();
      const param = currency === 'ethereum' ? 'value' : 'amount';
      return amount ? `${prefix}:${address}?${param}=${amount}` : `${prefix}:${address}`;
    }
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function contentTitle(content: Content): string {
  const f = content.fields;
  switch (content.type) {
    case 'url':
      return String(f.url ?? '').trim() || 'URL';
    case 'text':
      return (String(f.text ?? '').trim() || 'Text').slice(0, 60);
    case 'email':
      return (String(f.address ?? '').trim() || 'Email').slice(0, 60);
    case 'phone':
      return (String(f.phone ?? '').trim() || 'Phone').slice(0, 60);
    case 'sms':
      return `SMS to ${String(f.phone ?? '').trim() || '…'}`;
    case 'wifi':
      return `WiFi: ${String(f.ssid ?? '').trim() || '…'}`;
    case 'vcard':
      return `vCard: ${String(f.name ?? '').trim() || '…'}`;
    case 'geo':
      return `Geo: ${String(f.lat ?? '').trim()}, ${String(f.lon ?? '').trim()}`;
    case 'event':
      return `Event: ${String(f.title ?? '').trim() || '…'}`;
    case 'crypto':
      return `${String(f.currency ?? 'crypto')}: ${String(f.address ?? '').trim().slice(0, 20) || '…'}`;
  }
}