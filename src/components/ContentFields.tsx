import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';

import { emptyContent, type BlobRef, type Content, type ContentType } from '../lib/qr/content';
import type { UploadedFile } from '../lib/atproto/records';
import { Field, Segmented, Select, TextInput, Textarea, Toggle } from './ui';

type FieldMap = Record<string, unknown>;

function urlField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <Field label="URL" hint="https:// is added automatically if missing; http:// is left as-is.">
      <TextInput
        type="url"
        placeholder="https://example.com"
        value={String(getFields().url ?? '')}
        disabled={disabled}
        onInput={(e) => setFields({ url: e.currentTarget.value })}
      />
    </Field>
  );
}

function textField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <Field label="Text">
      <Textarea
        placeholder="Any text you want to encode…"
        value={String(getFields().text ?? '')}
        disabled={disabled}
        onInput={(e) => setFields({ text: e.currentTarget.value })}
      />
    </Field>
  );
}

function emailField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Address">
        <TextInput
          type="email"
          placeholder="you@example.com"
          value={String(getFields().address ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ address: e.currentTarget.value })}
        />
      </Field>
      <Field label="Subject">
        <TextInput
          value={String(getFields().subject ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ subject: e.currentTarget.value })}
        />
      </Field>
      <Field label="Body">
        <Textarea
          value={String(getFields().body ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ body: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function phoneField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <Field label="Phone number">
      <TextInput
        type="tel"
        placeholder="+15551234567"
        value={String(getFields().phone ?? '')}
        disabled={disabled}
        onInput={(e) => setFields({ phone: e.currentTarget.value })}
      />
    </Field>
  );
}

function smsField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Phone number">
        <TextInput
          type="tel"
          placeholder="+15551234567"
          value={String(getFields().phone ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ phone: e.currentTarget.value })}
        />
      </Field>
      <Field label="Message">
        <Textarea
          value={String(getFields().message ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ message: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function wifiField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Network name (SSID)">
        <TextInput
          value={String(getFields().ssid ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ ssid: e.currentTarget.value })}
        />
      </Field>
      <Field label="Password">
        <TextInput
          value={String(getFields().password ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ password: e.currentTarget.value })}
        />
      </Field>
      <Field label="Encryption">
        <Segmented
          value={String(getFields().encryption ?? 'WPA')}
          disabled={disabled}
          options={[
            { value: 'WPA', label: 'WPA/WPA2' },
            { value: 'WEP', label: 'WEP' },
            { value: 'nopass', label: 'None' },
          ]}
          onChange={(v) => setFields({ encryption: v })}
        />
      </Field>
      <Toggle
        checked={Boolean(getFields().hidden)}
        label="Hidden network"
        disabled={disabled}
        onChange={(v) => setFields({ hidden: v })}
      />
    </>
  );
}

function vcardField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Name">
        <TextInput
          value={String(getFields().name ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ name: e.currentTarget.value })}
        />
      </Field>
      <Field label="Organization">
        <TextInput
          value={String(getFields().org ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ org: e.currentTarget.value })}
        />
      </Field>
      <Field label="Title">
        <TextInput
          value={String(getFields().title ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ title: e.currentTarget.value })}
        />
      </Field>
      <Field label="Phone">
        <TextInput
          type="tel"
          value={String(getFields().phone ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ phone: e.currentTarget.value })}
        />
      </Field>
      <Field label="Email">
        <TextInput
          type="email"
          value={String(getFields().email ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ email: e.currentTarget.value })}
        />
      </Field>
      <Field label="Website">
        <TextInput
          type="url"
          value={String(getFields().url ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ url: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function geoField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <div class="grid grid-cols-2 gap-3">
      <Field label="Latitude">
        <TextInput
          type="number"
          step="any"
          placeholder="37.7749"
          value={String(getFields().lat ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ lat: e.currentTarget.value })}
        />
      </Field>
      <Field label="Longitude">
        <TextInput
          type="number"
          step="any"
          placeholder="-122.4194"
          value={String(getFields().lon ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ lon: e.currentTarget.value })}
        />
      </Field>
    </div>
  );
}

function eventField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Title">
        <TextInput
          value={String(getFields().title ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ title: e.currentTarget.value })}
        />
      </Field>
      <Field label="Location">
        <TextInput
          value={String(getFields().location ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ location: e.currentTarget.value })}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={String(getFields().description ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ description: e.currentTarget.value })}
        />
      </Field>
      <div class="grid grid-cols-2 gap-3">
        <Field label="Start">
          <TextInput
            type="datetime-local"
            value={String(getFields().start ?? '')}
            disabled={disabled}
            onInput={(e) => setFields({ start: e.currentTarget.value })}
          />
        </Field>
        <Field label="End">
          <TextInput
            type="datetime-local"
            value={String(getFields().end ?? '')}
            disabled={disabled}
            onInput={(e) => setFields({ end: e.currentTarget.value })}
          />
        </Field>
      </div>
    </>
  );
}

function cryptoField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void, disabled?: boolean) {
  return (
    <>
      <Field label="Currency">
        <Select
          value={String(getFields().currency ?? 'bitcoin')}
          disabled={disabled}
          onChange={(e) => setFields({ currency: e.currentTarget.value })}
          options={[
            { value: 'bitcoin', label: 'Bitcoin (BTC)' },
            { value: 'ethereum', label: 'Ethereum (ETH)' },
            { value: 'litecoin', label: 'Litecoin (LTC)' },
            { value: 'dogecoin', label: 'Dogecoin (DOGE)' },
            { value: 'monero', label: 'Monero (XMR)' },
            { value: 'bitcoincash', label: 'Bitcoin Cash (BCH)' },
          ]}
        />
      </Field>
      <Field label="Address">
        <TextInput
          value={String(getFields().address ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ address: e.currentTarget.value })}
        />
      </Field>
      <Field label="Amount (optional)">
        <TextInput
          type="number"
          step="any"
          value={String(getFields().amount ?? '')}
          disabled={disabled}
          onInput={(e) => setFields({ amount: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function FileField(props: {
  fields: FieldMap;
  disabled?: boolean;
  onUploadFile?: (file: File) => Promise<UploadedFile>;
  loginHref?: string;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const [uploading, setUploading] = createSignal(false);
  const [error, setError] = createSignal('');
  const hasFile = Boolean(props.fields.blob as BlobRef | null | undefined);

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be 25 MB or smaller.');
      return;
    }
    if (!props.onUploadFile) {
      setError('Sign in to upload a file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = await props.onUploadFile(file);
      props.onChange({
        name: uploaded.name,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        blob: uploaded.blob,
      });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label="File" hint="One file, up to 25 MB.">
      <Show when={!props.onUploadFile}>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <A href={props.loginHref ?? '/login'} class="font-semibold text-sky-600 hover:underline">
            Sign in
          </A>{' '}
          to upload a file to your Bluesky account.
        </div>
      </Show>

      <Show when={props.onUploadFile}>
        <Show
          when={hasFile}
          fallback={
            <input
              type="file"
              disabled={props.disabled || uploading()}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = '';
                if (file) void handleFile(file);
              }}
              class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:opacity-60 dark:text-slate-300 dark:file:bg-slate-700 dark:hover:file:bg-slate-600"
            />
          }
        >
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">{String(props.fields.name ?? '')}</p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {formatSize(Number(props.fields.size ?? 0))} · {String(props.fields.mimeType ?? '')}
            </p>
            <div class="mt-3 flex gap-2">
              <label
                class={`cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 ${
                  props.disabled ? 'pointer-events-none opacity-60' : ''
                } dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}
              >
                Replace
                <input
                  type="file"
                  class="hidden"
                  disabled={props.disabled || uploading()}
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    e.currentTarget.value = '';
                    if (file) void handleFile(file);
                  }}
                />
              </label>
              <button
                type="button"
                disabled={props.disabled || uploading()}
                onClick={() => props.onChange({ name: '', mimeType: '', size: 0, blob: null })}
                class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          </div>
        </Show>
      </Show>

      <Show when={uploading()}>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Uploading…</p>
      </Show>
      <Show when={error()}>
        <p class="mt-1 text-xs text-red-600 dark:text-red-400">{error()}</p>
      </Show>
    </Field>
  );
}

export function ContentFields(props: {
  content: Content;
  onChange: (content: Content) => void;
  disabled?: boolean;
  onUploadFile?: (file: File) => Promise<UploadedFile>;
  loginHref?: string;
}) {
  const getFields = () => props.content.fields;
  const setFields = (patch: FieldMap) =>
    props.onChange({ type: props.content.type, fields: { ...getFields(), ...patch } });

  return (
    <div class="space-y-4">
      <Field label="Content type">
        <Segmented
          value={props.content.type}
          disabled={props.disabled}
          onChange={(v) => {
            const type = v as ContentType;
            props.onChange(emptyContent(type));
          }}
          options={[
            { value: 'url', label: 'URL' },
            { value: 'text', label: 'Text' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'sms', label: 'SMS' },
            { value: 'wifi', label: 'WiFi' },
            { value: 'vcard', label: 'vCard' },
            { value: 'geo', label: 'Geo' },
            { value: 'event', label: 'Event' },
            { value: 'crypto', label: 'Crypto' },
            { value: 'file', label: 'File' },
          ]}
        />
      </Field>

      <Show when={props.content.type === 'url'}>{urlField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'text'}>{textField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'email'}>{emailField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'phone'}>{phoneField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'sms'}>{smsField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'wifi'}>{wifiField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'vcard'}>{vcardField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'geo'}>{geoField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'event'}>{eventField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'crypto'}>{cryptoField(getFields, setFields, props.disabled)}</Show>
      <Show when={props.content.type === 'file'}>
        <FileField
          fields={getFields()}
          disabled={props.disabled}
          onUploadFile={props.onUploadFile}
          loginHref={props.loginHref}
          onChange={setFields}
        />
      </Show>
    </div>
  );
}