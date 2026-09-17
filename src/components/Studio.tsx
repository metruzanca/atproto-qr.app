import { createSignal, Show } from 'solid-js';
import { browserUtils, type QRCodeStyling } from '@liquid-js/qr-code-styling';

import type { Draft } from '../lib/qr/record';
import { contentToValue } from '../lib/qr/content';
import { QRPreview } from './QRPreview';
import { ContentFields } from './ContentFields';
import { StyleControls } from './StyleControls';

interface Props {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onQRReady?: (qr: QRCodeStyling) => void;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  savedUrl?: string | null;
}

export function Studio(props: Props) {
  const [qr, setQr] = createSignal<QRCodeStyling | null>(null);
  const [downloading, setDownloading] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const data = () => contentToValue(props.draft.content);

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
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Content</h2>
          <ContentFields content={props.draft.content} onChange={(content) => props.onChange({ ...props.draft, content })} />
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
            <QRPreview data={data()} style={props.draft.style} class="max-w-full" onReady={(q) => setQr(q)} />
          </div>

          <Show when={props.onSave}>
            <button
              type="button"
              onClick={() => props.onSave?.()}
              disabled={!data() || props.saving}
              class="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {props.saving ? 'Saving…' : 'Save changes'}
            </button>
          </Show>

          <Show when={data()}>
            <div class="mt-5 flex flex-wrap items-center gap-2">
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
              <span class="font-semibold text-slate-700">Public URL:</span> {props.savedUrl}
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}