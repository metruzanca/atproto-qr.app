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
import type { QRStyle } from '../lib/qr/style';
import { codeUrl } from '../lib/qr/content';
import { qrValueFor, type QRRecord } from '../lib/qr/record';

type Entry =
  | { kind: 'qr'; rkey: string; record: QRRecord; stamp: string }
  | { kind: 'redirect'; rkey: string; target: string; stamp: string };

export default function Mine() {
  const navigate = useNavigate();
  const [items, setItems] = createSignal<QRRecordItem[]>([]);
  const [redirects, setRedirects] = createSignal<RedirectItem[]>([]);
  const [error, setError] = createSignal('');
  const pdsUrl = () => agent()?.session.info.aud ?? '';

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
    return [...qrs, ...rds].sort((a, b) => {
      const rankDiff = kindRank(a) - kindRank(b);
      if (rankDiff !== 0) return rankDiff;
      return b.stamp.localeCompare(a.stamp);
    });
  };

  const kindRank = (entry: Entry): number => {
    if (entry.kind === 'redirect') return 2;
    return entry.record.kind === 'dynamic' ? 0 : 1;
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
    if (!confirm('Delete this QR code? This removes the code and all of its old links from your Bluesky account, breaking every printed URL for it.')) return;
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
          <div class="spinner" />
        }
      >
        <Show
          when={profile()}
          fallback={
            <div class="card p-8 text-center">
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Sign in to see your QR codes</h1>
              <a href="/login" class="btn-primary mt-4 inline-block">
                Sign in
              </a>
            </div>
          }
        >
          {(p) => (
            <>
              <div class="mb-6 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My QR codes</h1>
                  <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {entries().length} saved as <span class="font-mono">{p().handle}</span>
                  </p>
                </div>
                <button type="button" onClick={() => navigate('/')} class="btn-primary shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  New
                </button>
              </div>

              <Show when={error()}>
                <p class="mb-4 text-sm text-red-600 dark:text-red-400">{error()}</p>
              </Show>

              <Show when={entries().length === 0 && !error()}>
                <div class="card p-10 text-center">
                  <p class="text-slate-600 dark:text-slate-300">No QR codes yet.</p>
                  <a href="/" class="mt-2 inline-block text-sm font-semibold text-sky-600 dark:text-sky-400">
                    Create your first one →
                  </a>
                </div>
              </Show>

              <ul class="space-y-3">
                <For each={entries()}>
                  {(entry) =>
                    entry.kind === 'qr'
                      ? renderQR({ handle: p().handle, did: p().did, pdsUrl: pdsUrl() }, entry, remove)
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
  p: { handle: string; did: string; pdsUrl: string },
  entry: Entry & { kind: 'qr' },
  onDelete: (rkey: string, aliases: string[] | undefined) => Promise<void>,
) {
  const url = `/${p.handle}/${entry.rkey}`;
  const kind = entry.record.kind ?? 'fixed';
  const payload = qrValueFor(entry.record, codeUrl(p.handle, entry.rkey), { pdsUrl: p.pdsUrl, did: p.did });
  const subtitle =
    entry.record.content.type === 'file'
      ? String(entry.record.content.fields.name ?? '')
      : payload;
  return (
    <li class="card flex items-center gap-4 p-3">
      <A
        href={`${url}/edit`}
        title="Edit"
        class="block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white/60 transition hover:opacity-80 dark:border-white/10 dark:bg-white/[0.04]"
      >
        <RecordThumb payload={payload} style={entry.record.style} />
      </A>
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <A href={`${url}/edit`} class="truncate transition hover:text-sky-600 hover:underline dark:hover:text-sky-400">
            {entry.rkey}
          </A>
          <span
            class={`badge ${
              kind === 'dynamic' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            {kind}
          </span>
          {entry.record.tracking && (
            <span
              class={`badge ${
                entry.record.tracking.source === 'global'
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              {entry.record.tracking.source === 'global' ? 'Global tracking' : 'Custom tracking'}
            </span>
          )}
        </p>
        <p class="truncate text-xs text-slate-500 dark:text-slate-400">
          {entry.record.content.type} · {subtitle || '—'} · Updated {entry.record.updatedAt.slice(0, 10)}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <A href={url} target="_blank" class="btn-ghost">
          View
        </A>
        {kind === 'dynamic' && <CopyLinkButton url={`${location.origin}${url}`} />}
        <A href={`${url}/edit`} class="btn-ghost text-sky-600 hover:bg-sky-500/10 hover:text-sky-700 dark:text-sky-400">
          Edit
        </A>
        <button
          type="button"
          onClick={() => onDelete(entry.rkey, entry.record.aliases)}
          class="btn-ghost text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
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
    <li class="card flex items-center gap-4 p-3">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-500/10 text-amber-500 dark:border-amber-500/30 dark:text-amber-300">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 truncate text-sm font-semibold text-slate-900 dark:text-white">
          <span class="badge bg-amber-500/15 text-amber-700 dark:text-amber-300">Redirect</span>
          {entry.rkey} → {entry.target}
        </p>
        <p class="truncate text-xs text-slate-500 dark:text-slate-400">
          {entry.stamp ? entry.stamp.slice(0, 10) : ''} · keeps old printed QR Codes working
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <A href={url} target="_blank" class="btn-ghost">
          View
        </A>
        <A href={`${url}/edit`} class="btn-ghost text-sky-600 hover:bg-sky-500/10 hover:text-sky-700 dark:text-sky-400">
          Edit
        </A>
        <button
          type="button"
          onClick={() => onDelete(entry.rkey)}
          class="btn-ghost text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function CopyLinkButton(props: { url: string }) {
  const [copied, setCopied] = createSignal(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button type="button" onClick={copy} title={props.url} class="btn-ghost">
      {copied() ? 'Copied!' : 'Copy link'}
    </button>
  );
}

function RecordThumb(props: { payload: string; style: QRStyle }) {
  let container: HTMLDivElement | undefined;

  onMount(() => {
    if (!container) return;
    if (!props.payload) return;
    const qr = new QRCodeStyling({
      size: 56,
      data: props.payload,
      qrOptions: { errorCorrectionLevel: props.style.errorCorrectionLevel },
      dotsOptions: { type: props.style.dotsType as never, color: props.style.dotsColor },
      backgroundOptions: { color: props.style.backgroundColor },
    });
    qr.append(container);
  });

  return <div ref={container} class="h-full w-full" />;
}
