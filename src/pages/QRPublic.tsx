import { createEffect, createSignal, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { profile } from '../lib/atproto/auth';
import { getGlobalAnalytics, getQRRecord, getRedirectRecord, getSettingsRecord } from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { codeUrl, contentTitle, contentToValue, isHttpUrl, type BlobRef } from '../lib/qr/content';
import { isValidRecord, qrValueFor, type QRKind } from '../lib/qr/record';
import { isValidSlug } from '../lib/qr/name';
import type { QRStyle } from '../lib/qr/style';
import { fireTracking, type TrackingConfig } from '../lib/qr/tracking';
import { QRPreview } from '../components/QRPreview';

export default function QRPublic() {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = createSignal<'loading' | 'found' | 'notfound' | 'error'>('loading');
  const [content, setContent] = createSignal<{ type: string; title: string; value: string; kind: QRKind } | null>(null);
  const [style, setStyle] = createSignal<QRStyle | null>(null);
  const [proxyOrigin, setProxyOrigin] = createSignal<string | undefined>(undefined);
  const [ownerDid, setOwnerDid] = createSignal<string | null>(null);
  const [file, setFile] = createSignal<{ name: string; size: number; mimeType: string; blobUrl: string } | null>(null);

  const isOwner = () => profile()?.did === ownerDid();

  const formatSize = (size: number): string => {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
  };

  const downloadFile = async (f: { name: string; blobUrl: string }) => {
    if (!f.blobUrl) return;
    try {
      const res = await fetch(f.blobUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(f.blobUrl, '_blank');
    }
  };

  const canOpenInline = (mimeType: string) =>
    /^(image\/|video\/|audio\/|text\/)|application\/pdf$/.test(mimeType);

  const openFile = async (f: { name: string; mimeType: string; blobUrl: string }) => {
    if (!f.blobUrl) return;
    if (!canOpenInline(f.mimeType)) {
      await downloadFile(f);
      return;
    }
    const win = window.open('', '_blank');
    try {
      const res = await fetch(f.blobUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch {
      if (win) win.location.href = f.blobUrl;
      else window.location.href = f.blobUrl;
    }
  };

  createEffect(async () => {
    const handle = params.handle;
    const id = params.id;
    if (!isHandle(handle) || !isRecordKey(id)) {
      setStatus('notfound');
      return;
    }

    try {
      const actor = await resolveHandle(handle);
      setOwnerDid(actor.did);
      const item = await getQRRecord(actor.pds, actor.did, id);
      if (!item || !isValidRecord(item.record)) {
        const redirect = await getRedirectRecord(actor.pds, actor.did, id);
        if (redirect && isValidSlug(redirect.target)) {
          navigate(`/${handle}/${redirect.target}`, { replace: true });
          return;
        }
        setStatus('notfound');
        return;
      }
      const ctx = { pdsUrl: actor.pds, did: actor.did };

      const trk = (item.record.kind ?? 'fixed') === 'dynamic' ? item.record.tracking : undefined;
      if (trk) {
        let cfg: TrackingConfig | undefined;
        if (trk.source === 'custom') {
          cfg = trk.config;
        } else if (trk.source === 'global') {
          cfg = await getGlobalAnalytics(actor.pds, actor.did);
        }
        if (cfg) {
          await fireTracking(cfg, { url: location.href, title: document.title, referrer: document.referrer });
        }
      }

      const stl = item.record.style;
      if (stl.image && stl.imageProxy && !stl.imageProxyUrl) {
        const settings = await getSettingsRecord(actor.pds, actor.did);
        setProxyOrigin(settings?.imageProxy ?? undefined);
      } else {
        setProxyOrigin(undefined);
      }

      const value = qrValueFor(item.record, codeUrl(params.handle, params.id), ctx);
      const dataValue = contentToValue(item.record.content, ctx);
      setStyle(item.record.style);
      setFile(null);
      setContent({
        type: item.record.content.type,
        title: contentTitle(item.record.content),
        value,
        kind: item.record.kind ?? 'fixed',
      });

      if (item.record.content.type === 'url' && isHttpUrl(dataValue)) {
        window.location.assign(dataValue);
        return;
      }

      if (item.record.content.type === 'file') {
        const blob = item.record.content.fields.blob as BlobRef | null | undefined;
        setFile({
          name: String(item.record.content.fields.name ?? ''),
          size: Number(item.record.content.fields.size ?? 0),
          mimeType: blob?.mimeType ?? '',
          blobUrl: dataValue,
        });
      }
      setStatus('found');
    } catch (err) {
      console.error(err);
      setStatus('notfound');
    }
  });

  return (
    <main class="mx-auto max-w-2xl px-4 py-12">
      <Show when={status() === 'loading'}>
        <div class="spinner" />
      </Show>

      <Show when={status() === 'notfound'}>
        <div class="card p-10 text-center">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">QR code not found</h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            We couldn't find this code on the owner's Bluesky account. It may have been deleted.
          </p>
        </div>
      </Show>

      <Show when={status() === 'found' && content() && style()}>
        <div class="card animate-fade-up p-6 sm:p-8">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="section-label">{content()!.type}</p>
              <h1 class="mt-1 flex flex-wrap items-center gap-2 truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                <span class="truncate">{content()!.title}</span>
                <span
                  class={`badge ${
                    content()!.kind === 'dynamic' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {content()!.kind}
                </span>
              </h1>
            </div>
            <Show when={isOwner()}>
              <a href={`/${params.handle}/${params.id}/edit`} class="btn-primary shrink-0 py-2">
                Edit
              </a>
            </Show>
          </div>

          <Show
            when={content()!.type === 'file' && file()}
            fallback={
              <div class="qr-stage mt-6 p-6 sm:p-8">
                <div class="rounded-xl bg-white p-3 shadow-[0_0_44px_-10px_rgb(14_165_233_/_0.45)] ring-1 ring-slate-900/5 dark:ring-white/10">
                  <QRPreview data={content()!.value} style={style()!} proxyOrigin={proxyOrigin()} class="max-w-full" />
                </div>
              </div>
            }
          >
            {(f) => (
              <div class="mt-6">
                <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">{f().name || 'file'}</p>
                    <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {f().mimeType || 'unknown type'} · {formatSize(f().size)}
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button type="button" onClick={() => downloadFile(f())} class="btn-primary py-2">
                      Download
                    </button>
                    <button type="button" onClick={() => openFile(f())} class="btn-secondary">
                      Open
                    </button>
                  </div>
                </div>
                <Show when={f().mimeType.startsWith('image/') && f().blobUrl}>
                  <div class="mt-4 flex justify-center rounded-xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
                    <img src={f().blobUrl} alt={f().name} class="max-h-96 max-w-full object-contain" />
                  </div>
                </Show>
              </div>
            )}
          </Show>

          <div class="mt-6 break-all rounded-xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
            <p class="section-label">Encoded data</p>
            <p class="mt-1 text-sm text-slate-700 dark:text-slate-200">{content()!.value}</p>
          </div>
        </div>
      </Show>
    </main>
  );
}