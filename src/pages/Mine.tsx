import { createEffect, createSignal, For, onMount, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { QRCodeStyling } from '@liquid-js/qr-code-styling';

import { agent, authReady, profile } from '../lib/atproto/auth';
import { authedClient, deleteQRRecord, listQRRecords, type QRRecordItem } from '../lib/atproto/records';
import { styleToOptions } from '../lib/qr/style';
import { contentTitle, contentToValue } from '../lib/qr/content';

export default function Mine() {
  const navigate = useNavigate();
  const [items, setItems] = createSignal<QRRecordItem[]>([]);
  const [error, setError] = createSignal('');

  const load = async () => {
    const a = agent();
    if (!a) return;
    try {
      setItems(await listQRRecords(authedClient(a), a.sub));
    } catch (err) {
      console.error(err);
      setError('Could not load your QR codes.');
    }
  };

  const remove = async (rkey: string) => {
    const a = agent();
    if (!a) return;
    if (!confirm('Delete this QR code? This removes the record from your PDS.')) return;
    try {
      await deleteQRRecord(authedClient(a), a.sub, rkey);
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
                    {items().length} saved as <span class="font-mono">{p().handle}</span>
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

              <Show when={items().length === 0 && !error()}>
                <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p class="text-slate-600">No QR codes yet.</p>
                  <a href="/" class="mt-2 inline-block text-sm font-semibold text-sky-600">
                    Create your first one →
                  </a>
                </div>
              </Show>

              <ul class="space-y-3">
                <For each={items()}>
                  {(item) => {
                    const url = `/${p().handle}/${item.rkey}`;
                    return (
                      <li class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                          <RecordThumb record={item.record} />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-semibold text-slate-900">{contentTitle(item.record.content)}</p>
                          <p class="truncate text-xs text-slate-500">
                            {item.record.content.type} · {item.record.updatedAt.slice(0, 10)}
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
                            onClick={() => remove(item.rkey)}
                            class="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </>
          )}
        </Show>
      </Show>
    </main>
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
  });

  return <div ref={container} class="h-full w-full" />;
}