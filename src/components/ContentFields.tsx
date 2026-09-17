import { Show } from 'solid-js';

import { emptyContent, type Content, type ContentType } from '../lib/qr/content';
import { Field, Segmented, Select, TextInput, Textarea, Toggle } from './ui';

type FieldMap = Record<string, unknown>;

function urlField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <Field label="URL" hint="https:// is added automatically if missing; http:// is left as-is.">
      <TextInput
        type="url"
        placeholder="https://example.com"
        value={String(getFields().url ?? '')}
        onInput={(e) => setFields({ url: e.currentTarget.value })}
      />
    </Field>
  );
}

function textField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <Field label="Text">
      <Textarea
        placeholder="Any text you want to encode…"
        value={String(getFields().text ?? '')}
        onInput={(e) => setFields({ text: e.currentTarget.value })}
      />
    </Field>
  );
}

function emailField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Address">
        <TextInput
          type="email"
          placeholder="you@example.com"
          value={String(getFields().address ?? '')}
          onInput={(e) => setFields({ address: e.currentTarget.value })}
        />
      </Field>
      <Field label="Subject">
        <TextInput
          value={String(getFields().subject ?? '')}
          onInput={(e) => setFields({ subject: e.currentTarget.value })}
        />
      </Field>
      <Field label="Body">
        <Textarea
          value={String(getFields().body ?? '')}
          onInput={(e) => setFields({ body: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function phoneField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <Field label="Phone number">
      <TextInput
        type="tel"
        placeholder="+15551234567"
        value={String(getFields().phone ?? '')}
        onInput={(e) => setFields({ phone: e.currentTarget.value })}
      />
    </Field>
  );
}

function smsField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Phone number">
        <TextInput
          type="tel"
          placeholder="+15551234567"
          value={String(getFields().phone ?? '')}
          onInput={(e) => setFields({ phone: e.currentTarget.value })}
        />
      </Field>
      <Field label="Message">
        <Textarea
          value={String(getFields().message ?? '')}
          onInput={(e) => setFields({ message: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function wifiField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Network name (SSID)">
        <TextInput
          value={String(getFields().ssid ?? '')}
          onInput={(e) => setFields({ ssid: e.currentTarget.value })}
        />
      </Field>
      <Field label="Password">
        <TextInput
          value={String(getFields().password ?? '')}
          onInput={(e) => setFields({ password: e.currentTarget.value })}
        />
      </Field>
      <Field label="Encryption">
        <Segmented
          value={String(getFields().encryption ?? 'WPA')}
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
        onChange={(v) => setFields({ hidden: v })}
      />
    </>
  );
}

function vcardField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Name">
        <TextInput
          value={String(getFields().name ?? '')}
          onInput={(e) => setFields({ name: e.currentTarget.value })}
        />
      </Field>
      <Field label="Organization">
        <TextInput
          value={String(getFields().org ?? '')}
          onInput={(e) => setFields({ org: e.currentTarget.value })}
        />
      </Field>
      <Field label="Title">
        <TextInput
          value={String(getFields().title ?? '')}
          onInput={(e) => setFields({ title: e.currentTarget.value })}
        />
      </Field>
      <Field label="Phone">
        <TextInput
          type="tel"
          value={String(getFields().phone ?? '')}
          onInput={(e) => setFields({ phone: e.currentTarget.value })}
        />
      </Field>
      <Field label="Email">
        <TextInput
          type="email"
          value={String(getFields().email ?? '')}
          onInput={(e) => setFields({ email: e.currentTarget.value })}
        />
      </Field>
      <Field label="Website">
        <TextInput
          type="url"
          value={String(getFields().url ?? '')}
          onInput={(e) => setFields({ url: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

function geoField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <div class="grid grid-cols-2 gap-3">
      <Field label="Latitude">
        <TextInput
          type="number"
          step="any"
          placeholder="37.7749"
          value={String(getFields().lat ?? '')}
          onInput={(e) => setFields({ lat: e.currentTarget.value })}
        />
      </Field>
      <Field label="Longitude">
        <TextInput
          type="number"
          step="any"
          placeholder="-122.4194"
          value={String(getFields().lon ?? '')}
          onInput={(e) => setFields({ lon: e.currentTarget.value })}
        />
      </Field>
    </div>
  );
}

function eventField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Title">
        <TextInput
          value={String(getFields().title ?? '')}
          onInput={(e) => setFields({ title: e.currentTarget.value })}
        />
      </Field>
      <Field label="Location">
        <TextInput
          value={String(getFields().location ?? '')}
          onInput={(e) => setFields({ location: e.currentTarget.value })}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={String(getFields().description ?? '')}
          onInput={(e) => setFields({ description: e.currentTarget.value })}
        />
      </Field>
      <div class="grid grid-cols-2 gap-3">
        <Field label="Start">
          <TextInput
            type="datetime-local"
            value={String(getFields().start ?? '')}
            onInput={(e) => setFields({ start: e.currentTarget.value })}
          />
        </Field>
        <Field label="End">
          <TextInput
            type="datetime-local"
            value={String(getFields().end ?? '')}
            onInput={(e) => setFields({ end: e.currentTarget.value })}
          />
        </Field>
      </div>
    </>
  );
}

function cryptoField(getFields: () => FieldMap, setFields: (patch: FieldMap) => void) {
  return (
    <>
      <Field label="Currency">
        <Select
          value={String(getFields().currency ?? 'bitcoin')}
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
          onInput={(e) => setFields({ address: e.currentTarget.value })}
        />
      </Field>
      <Field label="Amount (optional)">
        <TextInput
          type="number"
          step="any"
          value={String(getFields().amount ?? '')}
          onInput={(e) => setFields({ amount: e.currentTarget.value })}
        />
      </Field>
    </>
  );
}

export function ContentFields(props: { content: Content; onChange: (content: Content) => void }) {
  const getFields = () => props.content.fields;
  const setFields = (patch: FieldMap) =>
    props.onChange({ type: props.content.type, fields: { ...getFields(), ...patch } });

  return (
    <div class="space-y-4">
      <Field label="Content type">
        <Segmented
          value={props.content.type}
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

      <Show when={props.content.type === 'url'}>{urlField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'text'}>{textField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'email'}>{emailField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'phone'}>{phoneField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'sms'}>{smsField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'wifi'}>{wifiField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'vcard'}>{vcardField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'geo'}>{geoField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'event'}>{eventField(getFields, setFields)}</Show>
      <Show when={props.content.type === 'crypto'}>{cryptoField(getFields, setFields)}</Show>
    </div>
  );
}