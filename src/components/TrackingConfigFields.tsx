import { Show } from 'solid-js';

import { parseGtagId, type TrackingConfig } from '../lib/qr/tracking';
import { Field, Select, TextInput } from './ui';

interface Props {
  config: TrackingConfig | undefined;
  onChange: (config: TrackingConfig | undefined) => void;
}

const PROVIDERS: { value: TrackingConfig['provider']; label: string }[] = [
  { value: 'ga4', label: 'Google Analytics' },
  { value: 'plausible', label: 'Plausible' },
  { value: 'umami', label: 'Umami' },
  { value: 'matomo', label: 'Matomo' },
];

function emptyConfig(provider: TrackingConfig['provider']): TrackingConfig {
  switch (provider) {
    case 'ga4':
      return { provider, measurementId: '' };
    case 'plausible':
      return { provider, domain: '' };
    case 'umami':
      return { provider, websiteId: '', endpoint: '' };
    case 'matomo':
      return { provider, endpoint: '', siteId: 1 };
  }
}

export function TrackingConfigFields(props: Props) {
  const provider = () => props.config?.provider ?? 'ga4';

  const update = (patch: Partial<TrackingConfig>) => {
    const base = props.config ?? emptyConfig(provider());
    props.onChange({ ...base, ...patch } as TrackingConfig);
  };

  const onProvider = (value: string) => {
    const next = value as TrackingConfig['provider'];
    if (provider() !== next) {
      props.onChange(emptyConfig(next));
    }
  };

  const pasteGtag = (value: string) => {
    const id = parseGtagId(value);
    if (id) update({ measurementId: id });
  };

  return (
    <div class="space-y-3">
      <Field label="Provider">
        <Select options={PROVIDERS} value={provider()} onChange={(e) => onProvider(e.currentTarget.value)} />
      </Field>

      <Show when={provider() === 'ga4'}>
        <div class="grid gap-3">
          <Field label="Measurement ID" hint="e.g. G-XXXXXXXXXX">
            <TextInput
              placeholder="G-XXXXXXXXXX"
              spellcheck={false}
              value={props.config?.provider === 'ga4' ? props.config.measurementId : ''}
              onInput={(e) => update({ measurementId: e.currentTarget.value.trim() })}
            />
          </Field>
          <Field label="Paste your GA tag instead" hint="Paste a standard gtag.js snippet — the ID is extracted automatically.">
            <TextInput
              placeholder="<script async src=…gtag/js?id=G-…></script>"
              spellcheck={false}
              onInput={(e) => pasteGtag(e.currentTarget.value)}
            />
          </Field>
          <Field
            label="API secret (optional)"
            hint="Only if you want the no-script beacon. Note: it's stored in your public record, so anyone could send events to your property."
          >
            <TextInput
              placeholder="Leave blank to use the standard GA script"
              spellcheck={false}
              value={props.config?.provider === 'ga4' ? (props.config.apiSecret ?? '') : ''}
              onInput={(e) => update({ apiSecret: e.currentTarget.value.trim() || undefined })}
            />
          </Field>
        </div>
      </Show>

      <Show when={provider() === 'plausible'}>
        <div class="grid gap-3">
          <Field label="Site domain" hint="The domain registered in Plausible.">
            <TextInput
              placeholder="example.com"
              spellcheck={false}
              value={props.config?.provider === 'plausible' ? props.config.domain : ''}
              onInput={(e) => update({ domain: e.currentTarget.value.trim() })}
            />
          </Field>
          <Field label="Endpoint (optional)" hint="Leave blank for plausible.io, or set a self-hosted URL.">
            <TextInput
              placeholder="https://plausible.example.com"
              spellcheck={false}
              value={props.config?.provider === 'plausible' ? (props.config.endpoint ?? '') : ''}
              onInput={(e) => update({ endpoint: e.currentTarget.value.trim() || undefined })}
            />
          </Field>
        </div>
      </Show>

      <Show when={provider() === 'umami'}>
        <div class="grid gap-3">
          <Field label="Website ID">
            <TextInput
              placeholder="Umami website ID"
              spellcheck={false}
              value={props.config?.provider === 'umami' ? props.config.websiteId : ''}
              onInput={(e) => update({ websiteId: e.currentTarget.value.trim() })}
            />
          </Field>
          <Field label="Endpoint" hint="Your Umami instance, e.g. https://umami.example.com">
            <TextInput
              placeholder="https://umami.example.com"
              spellcheck={false}
              value={props.config?.provider === 'umami' ? props.config.endpoint : ''}
              onInput={(e) => update({ endpoint: e.currentTarget.value.trim() })}
            />
          </Field>
        </div>
      </Show>

      <Show when={provider() === 'matomo'}>
        <div class="grid gap-3">
          <Field label="Endpoint" hint="Your Matomo instance, e.g. https://matomo.example.com">
            <TextInput
              placeholder="https://matomo.example.com"
              spellcheck={false}
              value={props.config?.provider === 'matomo' ? props.config.endpoint : ''}
              onInput={(e) => update({ endpoint: e.currentTarget.value.trim() })}
            />
          </Field>
          <Field label="Site ID">
            <TextInput
              type="number"
              min="1"
              placeholder="1"
              value={props.config?.provider === 'matomo' ? String(props.config.siteId) : '1'}
              onInput={(e) => update({ siteId: Number(e.currentTarget.value) || 1 })}
            />
          </Field>
        </div>
      </Show>
    </div>
  );
}