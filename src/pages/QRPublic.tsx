import { createEffect, createSignal, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { profile } from '../lib/atproto/auth';
import { getQRRecord } from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { contentTitle, contentToValue, isHttpUrl } from '../lib/qr/content';
import { isValidRecord } from '../lib/qr/record';
import type { QRStyle } from '../lib/qr/style';
import { QRPreview } from '../components/QRPreview';

export default function QRPublic() {
  const params = useParams<{ handle: string; id: string }>();

  const [status, setStatus] = createSignal<'loading' | 'found' | 'notfound' | 'error'>('loading');
  const [content, setContent] = createSignal<{ type: string; title: string; value: string } | null>(null);
  const [style, setStyle] = createSignal<QRStyle | null>(null);
  const [ownerDid, setOwnerDid] = createSignal<string | null>(null);
  const [redirect, setRedirect] = createSignal<{ value: string; countdown: number } | null>(null);

  const isOwner = () => profile()?.did === ownerDid();

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
        setStatus('notfound');
        return;
      }
      const value = contentToValue(item.record.content);
      setStyle(item.record.style);
      setContent({ type: item.record.content.type, title: contentTitle(item.record.content), value });

      if (item.record.content.type === 'url' && isHttpUrl(value)) {
        setRedirect({ value, countdown: 5 });
      } else {
        setStatus('found');
      }
    } catch (err) {
      console.error(err);
      setStatus('notfound');
    }
  });

  createEffect(() => {
    const r = redirect();
    if (!r) return;
    if (r.countdown <= 0) {
      window.location.assign(r.value);
      return;
    }
    const t = setTimeout(() => setRedirect({ value: r.value, countdown: r.countdown - 1 }), 1000);
    return () => clearTimeout(t);
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

      <Show when={redirect()}>
        {(r) => (
          <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p class="text-sm text-slate-600">
              This QR code redirects to
            </p>
            <p class="mt-2 break-all text-lg font-semibold text-sky-700">{r().value}</p>
            <p class="mt-2 text-xs text-slate-500">Redirecting in {r().countdown}s…</p>
            <button
              type="button"
              onClick={() => window.location.assign(r().value)}
              class="mt-5 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Continue to site
            </button>
            <a href="/" class="mt-3 block text-sm font-medium text-slate-500 hover:text-slate-700">
              Go back to atproto QR
            </a>
          </div>
        )}
      </Show>

      <Show when={status() === 'found' && content() && style()}>
        <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{content()!.type}</p>
              <h1 class="mt-1 truncate text-xl font-bold text-slate-900">{content()!.title}</h1>
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

          <div class="mt-6 flex justify-center rounded-lg bg-slate-50 p-8">
            <QRPreview data={content()!.value} style={style()!} class="max-w-full" />
          </div>

          <div class="mt-6 break-all rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Encoded data</p>
            <p class="mt-1 text-sm text-slate-700">{content()!.value}</p>
          </div>
        </div>
      </Show>
    </main>
  );
}