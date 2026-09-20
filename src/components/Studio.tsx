import { createEffect, createSignal, Show, type JSX } from 'solid-js';
import { A } from '@solidjs/router';
import { browserUtils, type QRCodeStyling } from '@liquid-js/qr-code-styling';

import type { Draft, QRKind } from '../lib/qr/record';
import { contentToValue } from '../lib/qr/content';
import { isDefaultStyle } from '../lib/qr/style';
import { trackingConfigSummary, type QRCodeTracking, type TrackingConfig } from '../lib/qr/tracking';
import { resolveProxyOrigin } from '../lib/qr/imageProxy';
import type { UploadedFile } from '../lib/atproto/records';
import { QRPreview } from './QRPreview';
import { ContentFields } from './ContentFields';
import { StyleControls } from './StyleControls';
import { ConfirmDialog } from './ConfirmDialog';
import { TrackingConfigFields } from './TrackingConfigFields';
import { Segmented, TextInput } from './ui';

interface Props {
  draft: Draft;
  onChange: (draft: Draft) => void;
  kind: QRKind;
  onKindChange?: (kind: QRKind) => void;
  contentLocked?: boolean;
  onUnlockContent?: () => void;
  qrData?: string;
  emptyHint?: string;
  loginHref?: string;
  onUploadFile?: (file: File) => Promise<UploadedFile>;
  onQRReady?: (qr: QRCodeStyling) => void;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  savedUrl?: string | null;
  name?: string;
  onNameChange?: (name: string) => void;
  onGenerateName?: () => void;
  nameError?: string;
  tracking?: QRCodeTracking;
  onTrackingChange?: (tracking: QRCodeTracking | undefined) => void;
  globalAnalytics?: TrackingConfig | undefined;
}

const iconClass = 'h-4 w-4';

const kindIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 18 9 5 9-5" />
  </svg>
);

const contentIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const styleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const analyticsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m7 16 4-5 3 3 5-7" />
  </svg>
);

const previewIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export function Studio(props: Props) {
  const [qr, setQr] = createSignal<QRCodeStyling | null>(null);
  const [downloading, setDownloading] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [showUnlockModal, setShowUnlockModal] = createSignal(false);
  const [styleOpen, setStyleOpen] = createSignal(!isDefaultStyle(props.draft.style));
  const [customConfig, setCustomConfig] = createSignal<TrackingConfig>({ provider: 'ga4', measurementId: '' });

  createEffect(() => {
    const t = props.tracking;
    if (t?.source === 'custom') setCustomConfig(t.config);
  });

  const trackingSource = () => props.tracking?.source ?? 'none';

  const setTrackingSource = (source: 'none' | 'global' | 'custom') => {
    if (source === 'none') {
      props.onTrackingChange?.(undefined);
    } else if (source === 'global') {
      props.onTrackingChange?.({ source: 'global' });
    } else {
      props.onTrackingChange?.({ source: 'custom', config: customConfig() });
    }
  };

  const onCustomConfigChange = (config: TrackingConfig | undefined) => {
    if (!config) return;
    setCustomConfig(config);
    if (trackingSource() === 'custom') {
      props.onTrackingChange?.({ source: 'custom', config });
    }
  };

  const data = () => props.qrData ?? contentToValue(props.draft.content);

  const download = async (extension: 'png' | 'svg' = 'png') => {
    const instance = qr();
    if (!instance || !browserUtils) return;
    setDownloading(true);
    try {
      await browserUtils.download(instance, {
        name: `qr-${props.draft.content.type}`,
        extension,
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = async () => {
    const url = props.savedUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div class="min-w-0 space-y-8">
        <Show when={props.onKindChange}>
          <section class="card p-5">
            <SectionHeader icon={kindIcon} title="Code type" hint="Fixed encodes your data; Dynamic encodes a link to it" />
            <Segmented
              value={props.kind}
              options={[
                { value: 'fixed', label: 'Fixed' },
                { value: 'dynamic', label: 'Dynamic' },
              ]}
              onChange={(v) => props.onKindChange?.(v as QRKind)}
            />

            <Show when={props.kind === 'fixed'}>
              <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Fixed: the QR encodes your data directly. After saving, the data is locked — you can change the look,
                but the printed image stays the same.
              </p>
            </Show>

            <Show when={props.kind === 'dynamic' && props.onSave}>
              <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Dynamic: the QR encodes a link back to this app. You can change the data any time — the printed QR
                never changes.
              </p>
            </Show>

            <Show when={props.kind === 'dynamic' && !props.onSave && props.loginHref}>
              <div class="relative mt-4 overflow-hidden rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-500/10 to-blue-600/10 p-4 dark:border-sky-500/30 dark:from-sky-500/15 dark:to-blue-600/15">
                <div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl dark:bg-sky-400/10" />
                <h3 class="text-sm font-semibold text-sky-900 dark:text-sky-100">How dynamic codes work</h3>
                <p class="mt-1 text-xs leading-relaxed text-sky-800 dark:text-sky-200">
                  Print once, update any time. The code never changes, and always shows your latest info.{' '}
                  <A href="/about" class="font-semibold text-sky-700 hover:underline dark:text-sky-300">
                    Learn more →
                  </A>
                </p>
                <div class="mt-3">
                  <a href={props.loginHref} class="btn-primary py-2">
                    Sign in to save
                  </a>
                </div>
              </div>
            </Show>
          </section>
        </Show>

        <section class="card p-5">
          <SectionHeader icon={contentIcon} title="Content" hint="What your QR code points to" />
          <div class="relative">
            <ContentFields
              content={props.draft.content}
              disabled={props.contentLocked}
              onUploadFile={props.onUploadFile}
              loginHref={props.loginHref}
              onChange={(content) => props.onChange({ ...props.draft, content })}
            />

            <Show when={props.contentLocked}>
              <div class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px] dark:bg-[#060a13]/60">
                <button
                  type="button"
                  class="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-4 shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_12px_32px_-12px_rgb(14_165_233_/_0.4)] dark:border-white/10 dark:bg-white/[0.08] dark:hover:border-sky-500/40"
                  onClick={() => setShowUnlockModal(true)}
                  aria-label="Unlock data editing"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-7 w-7 text-slate-500 group-hover:hidden dark:text-slate-300"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="hidden h-7 w-7 text-sky-600 group-hover:block"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 7.9-1" />
                  </svg>
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Edit data</span>
                </button>
              </div>
            </Show>
          </div>
        </section>

        <section class="card p-5">
          <button
            type="button"
            onClick={() => setStyleOpen(!styleOpen())}
            aria-expanded={styleOpen()}
            aria-controls="style-controls"
            class="mb-1 flex w-full items-center justify-between gap-4 text-left"
          >
            <SectionHeader icon={styleIcon} title="Style" hint="Colors, shapes, logo" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${styleOpen() ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div class={`collapsible ${styleOpen() ? 'is-open' : ''}`}>
            <div id="style-controls" class="pt-3">
              <StyleControls
                style={props.draft.style}
                defaultProxyOrigin={resolveProxyOrigin(undefined)}
                onChange={(style) => props.onChange({ ...props.draft, style })}
              />
            </div>
          </div>
        </section>

        <Show when={props.onSave && props.kind === 'dynamic'}>
          <section class="card p-5">
            <SectionHeader icon={analyticsIcon} title="Analytics" hint="Counts every visit to this code's page" />

            <div class="space-y-2.5">
              <RadioItem
                checked={trackingSource() === 'none'}
                label="No tracking"
                onClick={() => setTrackingSource('none')}
              />
              <RadioItem
                checked={trackingSource() === 'global'}
                disabled={!props.globalAnalytics}
                label="Use global tracking"
                hint={
                  props.globalAnalytics
                    ? trackingConfigSummary(props.globalAnalytics)
                    : 'No global config yet — set one up in Settings.'
                }
                onClick={() => setTrackingSource('global')}
              />
              <RadioItem
                checked={trackingSource() === 'custom'}
                label="Custom tracking"
                hint="Use a different setup just for this code."
                onClick={() => setTrackingSource('custom')}
              />
            </div>

            <Show when={trackingSource() === 'global'}>
              <div class="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                <span class="text-xs text-slate-600 dark:text-slate-300">
                  {props.globalAnalytics ? trackingConfigSummary(props.globalAnalytics) : 'Global tracking is not configured yet.'}
                </span>
                <A href="/settings" class="shrink-0 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400">
                  {props.globalAnalytics ? 'Edit global' : 'Set up global tracking'}
                </A>
              </div>
            </Show>

            <Show when={trackingSource() === 'custom'}>
              <div class="mt-3 rounded-xl border border-slate-200/80 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <TrackingConfigFields config={customConfig()} onChange={onCustomConfigChange} />
              </div>
            </Show>
          </section>
        </Show>
      </div>

      <div class="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <section class="card p-5">
          <SectionHeader icon={previewIcon} title="Preview" hint="What scanners will see" />

          <div class="qr-stage mt-4 p-6 sm:p-8">
            <div class="rounded-xl bg-white p-3 shadow-[0_0_44px_-10px_rgb(14_165_233_/_0.45)] ring-1 ring-slate-900/5 dark:ring-white/10">
              <QRPreview
                data={data()}
                style={props.draft.style}
                proxyOrigin={resolveProxyOrigin(undefined)}
                class="max-w-full"
                emptyHint={props.emptyHint}
                onReady={(q) => setQr(q)}
              />
            </div>
          </div>

          <Show when={props.kind === 'dynamic' && data()}>
            <p class="mt-3 break-all text-center text-xs text-slate-500 dark:text-slate-400">
              QR encodes: <span class="font-mono">{data()}</span>
            </p>
          </Show>

          <Show when={props.onSave}>
            <div class="mt-5">
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <label class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Name
                  </label>
                  <TextInput
                    placeholder="happy-otter"
                    spellcheck={false}
                    value={props.name ?? ''}
                    onInput={(e) => props.onNameChange?.(e.currentTarget.value)}
                  />
                </div>
                <button type="button" onClick={() => props.onGenerateName?.()} class="btn-secondary shrink-0">
                  Generate
                </button>
              </div>
              <Show when={props.nameError}>
                <p class="mt-1 text-xs text-red-600 dark:text-red-400">{props.nameError}</p>
              </Show>
            </div>

            <button
              type="button"
              onClick={() => props.onSave?.()}
              disabled={!data() || props.saving || Boolean(props.nameError)}
              class="btn-primary mt-4 w-full py-3"
            >
              {props.saving ? 'Saving…' : 'Save changes'}
            </button>
          </Show>

          <Show when={data()}>
            <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => download('png')}
                disabled={downloading()}
                class="btn-primary"
              >
                {downloading() ? 'Rendering…' : 'Download PNG'}
              </button>
              <button type="button" onClick={() => download('svg')} class="btn-secondary">
                Download SVG
              </button>
              <Show when={props.savedUrl}>
                <button type="button" onClick={copyLink} class="btn-secondary">
                  {copied() ? 'Copied!' : 'Copy link'}
                </button>
              </Show>
            </div>
          </Show>
        </section>
      </div>

      <ConfirmDialog
        open={showUnlockModal()}
        title="Edit QR Code data?"
        message="Changes to data will result in a new image."
        confirmLabel="Confirm"
        onConfirm={() => {
          setShowUnlockModal(false);
          props.onUnlockContent?.();
        }}
        onCancel={() => setShowUnlockModal(false)}
      />
    </div>
  );
}

function SectionHeader(props: { icon: JSX.Element; title: string; hint?: string; class?: string }) {
  return (
    <div class={`flex items-center gap-2.5 ${props.class ?? ''}`}>
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-600/15 text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400 dark:ring-sky-400/20">
        {props.icon}
      </span>
      <div class="min-w-0">
        <h2 class="text-sm font-bold text-slate-900 dark:text-white">{props.title}</h2>
        {props.hint ? <p class="text-xs text-slate-400 dark:text-slate-500">{props.hint}</p> : null}
      </div>
    </div>
  );
}

function RadioItem(props: {
  checked: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <label
      class={`flex items-start gap-2.5 text-sm ${props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        type="radio"
        name="qr-tracking"
        checked={props.checked}
        disabled={props.disabled}
        onChange={props.onClick}
        class="mt-0.5 h-4 w-4 shrink-0 accent-sky-600 disabled:opacity-40"
      />
      <span>
        <span class="font-medium text-slate-900 dark:text-white">{props.label}</span>
        {props.hint ? <span class="block text-xs text-slate-500 dark:text-slate-400">{props.hint}</span> : null}
      </span>
    </label>
  );
}