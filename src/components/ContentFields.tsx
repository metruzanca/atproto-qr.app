import { Show } from 'solid-js';

import { emptyContent, type Content, type ContentType } from '../lib/qr/content';
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

export function ContentFields(props: {
  content: Content;
  onChange: (content: Content) => void;
  disabled?: boolean;
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
    </div>
  );
}