import { createEffect, createSignal, For, onMount, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { QRCodeStyling } from '@liquid-js/qr-code-styling';

import { agent, authReady, profile } from '../lib/atproto/auth';
import {
  authedClient,
  cascadeDeleteQRRecord,
  deleteRedirectRecord,
  listQRRecords,
  listRedirectRecords,
  type QRRecordItem,
  type RedirectItem,
} from '../lib/atproto/records';
import { styleToOptions } from '../lib/qr/style';
import { contentToValue } from '../lib/qr/content';
import type { QRRecord } from '../lib/qr/record';

type Entry =
  | { kind: 'qr'; rkey: string; record: QRRecord; stamp: string }
  | { kind: 'redirect'; rkey: string; target: string; stamp: string };

export default function Mine() {
  const navigate = useNavigate();
  const [items, setItems] = createSignal<QRRecordItem[]>([]);
  const [redirects, setRedirects] = createSignal<RedirectItem[]>([]);
  const [error, setError] = createSignal('');

  const entries = () => {
    const redirectKeys = new Set(redirects().map((r) => r.rkey));
    const qrs: Entry[] = items()
      .filter((i) => !redirectKeys.has(i.rkey))
      .map((i) => ({
        kind: 'qr',
        rkey: i.rkey,
        record: i.record,
        stamp: i.record.updatedAt,
      }));
    const rds: Entry[] = redirects().map((r) => ({
      kind: 'redirect',
      rkey: r.rkey,
      target: r.target,
      stamp: r.createdAt,
    }));
    return [...qrs, ...rds].sort((a, b) => b.stamp.localeCompare(a.stamp));
  };

  const load = async () => {
    const a = agent();
    if (!a) return;
    try {
      setItems(await listQRRecords(authedClient(a), a.sub));
      setRedirects(await listRedirectRecords(authedClient(a), a.sub));
    } catch (err) {
      console.error(err);
      setError('Could not load your QR codes.');
    }
  };

  const removeRedirect = async (rkey: string) => {
    const a = agent();
    if (!a) return;
    if (
      !confirm(
        'Delete this redirect? This breaks the old URL it was printed under — any printed QR code using it will stop working.',
      )
    ) {
      return;
    }
    try {
      await deleteRedirectRecord(authedClient(a), a.sub, rkey);
      setRedirects(redirects().filter((r) => r.rkey !== rkey));
    } catch (err) {
      console.error(err);
      alert('Could not delete the redirect.');
    }
  };

  const remove = async (rkey: string, aliases: string[] | undefined) => {
    const a = agent();
    if (!a) return;
    if (!confirm('Delete this QR code? This removes the record and all of its redirect records from your PDS, breaking every printed URL for it.')) return;
    try {
      await cascadeDeleteQRRecord(authedClient(a), a.sub, rkey, aliases ?? []);
      setItems(items().filter((i) => i.rkey !== rkey));
    } catch (err) {
      console.error(err);
      alert('Could not delete the record.');
    }
  };

  createEffect(() => {
    if (authReady()) load();
  });

  return (
    <main class="mx-auto max-w-4xl px-4 py-8">
      <Show
        when={authReady()}
        fallback={
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
        }
      >
        <Show
          when={profile()}
          fallback={
            <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h1 class="text-xl font-bold text-slate-900">Sign in to see your QR codes</h1>
              <a href="/login" class="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                Sign in
              </a>
            </div>
          }
        >
          {(p) => (
            <>
              <div class="mb-6 flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold text-slate-900">My QR codes</h1>
                  <p class="text-sm text-slate-500">
                    {entries().length} saved as <span class="font-mono">{p().handle}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  + New
                </button>
              </div>

              <Show when={error()}>
                <p class="mb-4 text-sm text-red-600">{error()}</p>
              </Show>

              <Show when={entries().length === 0 && !error()}>
                <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p class="text-slate-600">No QR codes yet.</p>
                  <a href="/" class="mt-2 inline-block text-sm font-semibold text-sky-600">
                    Create your first one →
                  </a>
                </div>
              </Show>

              <ul class="space-y-3">
                <For each={entries()}>
                  {(entry) =>
                    entry.kind === 'qr'
                      ? renderQR(p(), entry, remove)
                      : renderRedirect(p(), entry, removeRedirect)
                  }
                </For>
              </ul>
            </>
          )}
        </Show>
      </Show>
    </main>
  );
}

function renderQR(
  p: { handle: string },
  entry: Entry & { kind: 'qr' },
  onDelete: (rkey: string, aliases: string[] | undefined) => Promise<void>,
) {
  const url = `/${p.handle}/${entry.rkey}`;
  return (
    <li class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
        <RecordThumb record={entry.record} />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-slate-900">{entry.rkey}</p>
        <p class="truncate text-xs text-slate-500">
          {entry.record.content.type} · {contentToValue(entry.record.content) || '—'} · {entry.record.updatedAt.slice(0, 10)}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <A href={url} target="_blank" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          View
        </A>
        <A href={`${url}/edit`} class="rounded-lg px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50">
          Edit
        </A>
        <button
          type="button"
          onClick={() => onDelete(entry.rkey, entry.record.aliases)}
          class="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function renderRedirect(
  p: { handle: string },
  entry: Entry & { kind: 'redirect' },
  onDelete: (rkey: string) => Promise<void>,
) {
  const url = `/${p.handle}/${entry.rkey}`;
  return (
    <li class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Redirect
          </span>
          {entry.rkey} → {entry.target}
        </p>
        <p class="truncate text-xs text-slate-500">
          {entry.stamp ? entry.stamp.slice(0, 10) : ''} · keeps old printed QR Codes working
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <A href={url} target="_blank" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          View
        </A>
        <A href={`${url}/edit`} class="rounded-lg px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50">
          Edit
        </A>
        <button
          type="button"
          onClick={() => onDelete(entry.rkey)}
          class="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function RecordThumb(props: { record: QRRecordItem['record'] }) {
  let container: HTMLDivElement | undefined;

  onMount(() => {
    if (!container) return;
    const data = contentToValue(props.record.content);
    if (!data) return;
    const qr = new QRCodeStyling({
      size: 56,
      data,
      qrOptions: { errorCorrectionLevel: props.record.style.errorCorrectionLevel },
      dotsOptions: { type: props.record.style.dotsType as never, color: props.record.style.dotsColor },
      backgroundOptions: { color: props.record.style.backgroundColor },
    });
    qr.append(container);
    const svg = container.querySelector('svg');
    svg?.setAttribute('class', 'h-14 w-14');
  });

  return <div ref={container} class="h-full w-full" />;
}
