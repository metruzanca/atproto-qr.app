import { createEffect, createSignal, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { profile } from '../lib/atproto/auth';
import { getQRRecord, getRedirectRecord } from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { codeUrl, contentTitle, contentToValue, isHttpUrl, type BlobRef } from '../lib/qr/content';
import { isValidRecord, qrValueFor, type QRKind } from '../lib/qr/record';
import { isValidSlug } from '../lib/qr/name';
import type { QRStyle } from '../lib/qr/style';
import { QRPreview } from '../components/QRPreview';

export default function QRPublic() {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = createSignal<'loading' | 'found' | 'notfound' | 'error'>('loading');
  const [content, setContent] = createSignal<{ type: string; title: string; value: string; kind: QRKind } | null>(null);
  const [style, setStyle] = createSignal<QRStyle | null>(null);
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
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      </Show>

      <Show when={status() === 'notfound'}>
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 class="text-xl font-bold text-slate-900">QR code not found</h1>
          <p class="mt-2 text-sm text-slate-600">
            We couldn't find this code on the owner's personal data server. It may have been deleted.
          </p>
        </div>
      </Show>

      <Show when={status() === 'found' && content() && style()}>
        <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{content()!.type}</p>
              <h1 class="mt-1 flex items-center gap-2 truncate text-xl font-bold text-slate-900">
                <span class="truncate">{content()!.title}</span>
                <span
                  class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    content()!.kind === 'dynamic' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {content()!.kind}
                </span>
              </h1>
            </div>
            <Show when={isOwner()}>
              <a
                href={`/${params.handle}/${params.id}/edit`}
                class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Edit
              </a>
            </Show>
          </div>

          <Show
            when={content()!.type === 'file' && file()}
            fallback={
              <div class="mt-6 flex justify-center rounded-lg bg-slate-50 p-8">
                <QRPreview data={content()!.value} style={style()!} class="max-w-full" />
              </div>
            }
          >
            {(f) => (
              <div class="mt-6">
                <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{f().name || 'file'}</p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      {f().mimeType || 'unknown type'} · {formatSize(f().size)}
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadFile(f())}
                      class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                      Download
                    </button>
                    <a
                      href={f().blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Open
                    </a>
                  </div>
                </div>
                <Show when={f().mimeType.startsWith('image/') && f().blobUrl}>
                  <div class="mt-4 flex justify-center rounded-lg bg-slate-50 p-4">
                    <img src={f().blobUrl} alt={f().name} class="max-h-96 max-w-full object-contain" />
                  </div>
                </Show>
                <Show when={f().mimeType === 'application/pdf' && f().blobUrl}>
                  <iframe
                    src={f().blobUrl}
                    title={f().name}
                    class="mt-4 h-96 w-full rounded-lg border border-slate-200 bg-slate-50"
                  />
                </Show>
              </div>
            )}
          </Show>

          <div class="mt-6 break-all rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Encoded data</p>
            <p class="mt-1 text-sm text-slate-700">{content()!.value}</p>
          </div>
        </div>
      </Show>
    </main>
  );
}