import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { browserUtils, type QRCodeStyling } from '@liquid-js/qr-code-styling';

import type { Draft, QRKind } from '../lib/qr/record';
import { contentToValue } from '../lib/qr/content';
import type { UploadedFile } from '../lib/atproto/records';
import { QRPreview } from './QRPreview';
import { ContentFields } from './ContentFields';
import { StyleControls } from './StyleControls';
import { ConfirmDialog } from './ConfirmDialog';
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
}

export function Studio(props: Props) {
  const [qr, setQr] = createSignal<QRCodeStyling | null>(null);
  const [downloading, setDownloading] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [showUnlockModal, setShowUnlockModal] = createSignal(false);

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
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-8">
        <Show when={props.onKindChange}>
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Code type</h2>
            <Segmented
              value={props.kind}
              options={[
                { value: 'fixed', label: 'Fixed' },
                { value: 'dynamic', label: 'Dynamic' },
              ]}
              onChange={(v) => props.onKindChange?.(v as QRKind)}
            />

            <Show when={props.kind === 'fixed'}>
              <p class="mt-3 text-xs leading-relaxed text-slate-500">
                Fixed: the QR encodes your data directly. After saving, the data is locked — you can change the look,
                but the printed image stays the same.
              </p>
            </Show>

            <Show when={props.kind === 'dynamic' && props.onSave}>
              <p class="mt-3 text-xs leading-relaxed text-slate-500">
                Dynamic: the QR encodes a link back to this app. You can change the data any time — the printed QR
                never changes.
              </p>
            </Show>

            <Show when={props.kind === 'dynamic' && !props.onSave && props.loginHref}>
              <div class="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                <h3 class="text-sm font-semibold text-sky-900">How dynamic codes work</h3>
                <p class="mt-1 text-xs leading-relaxed text-sky-800">
                  Print once, update any time. The code never changes, and always shows your latest info.{' '}
                  <A href="/about" class="font-semibold text-sky-700 hover:underline">
                    Learn more →
                  </A>
                </p>
                <div class="mt-3">
                  <a
                    href={props.loginHref}
                    class="inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                  >
                    Sign in to save
                  </a>
                </div>
              </div>
            </Show>
          </section>
        </Show>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Content</h2>
          <div class="relative">
            <ContentFields
              content={props.draft.content}
              disabled={props.contentLocked}
              onUploadFile={props.onUploadFile}
              loginHref={props.loginHref}
              onChange={(content) => props.onChange({ ...props.draft, content })}
            />

            <Show when={props.contentLocked}>
              <div class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                <button
                  type="button"
                  class="group flex flex-col items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-4 shadow-md transition hover:border-sky-400 hover:shadow-lg"
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
                    class="h-7 w-7 text-slate-600 group-hover:hidden"
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
                  <span class="text-xs font-semibold text-slate-700">Edit data</span>
                </button>
              </div>
            </Show>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Style</h2>
          <StyleControls style={props.draft.style} onChange={(style) => props.onChange({ ...props.draft, style })} />
        </section>
      </div>

      <div class="lg:sticky lg:top-6 lg:self-start">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h2>
          <div class="flex justify-center rounded-lg bg-slate-50 p-6">
            <QRPreview
              data={data()}
              style={props.draft.style}
              class="max-w-full"
              emptyHint={props.emptyHint}
              onReady={(q) => setQr(q)}
            />
          </div>

          <Show when={props.kind === 'dynamic' && data()}>
            <p class="mt-2 break-all text-center text-xs text-slate-500">
              QR encodes: <span class="font-mono">{data()}</span>
            </p>
          </Show>

          <Show when={props.onSave}>
            <div class="mt-5">
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </label>
                  <TextInput
                    placeholder="happy-otter"
                    spellcheck={false}
                    value={props.name ?? ''}
                    onInput={(e) => props.onNameChange?.(e.currentTarget.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => props.onGenerateName?.()}
                  class="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Generate
                </button>
              </div>
              <Show when={props.nameError}>
                <p class="mt-1 text-xs text-red-600">{props.nameError}</p>
              </Show>
            </div>

            <button
              type="button"
              onClick={() => props.onSave?.()}
              disabled={!data() || props.saving || Boolean(props.nameError)}
              class="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
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
                class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
              >
                {downloading() ? 'Rendering…' : 'Download PNG'}
              </button>
              <button
                type="button"
                onClick={() => download('svg')}
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Download SVG
              </button>
              <Show when={props.savedUrl}>
                <button
                  type="button"
                  onClick={copyLink}
                  class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {copied() ? 'Copied!' : 'Copy link'}
                </button>
              </Show>
            </div>
          </Show>

          <Show when={props.savedUrl}>
            <p class="mt-3 break-all text-xs text-slate-500">
              <span class="font-semibold text-slate-700">Public URL:</span>{' '}
              <a
                href={props.savedUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sky-600 hover:underline"
              >
                {props.savedUrl}
              </a>
            </p>
          </Show>
        </div>
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