import { createEffect, createSignal, Show } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { agent, authReady, profile } from '../lib/atproto/auth';
import { authedClient, deleteQRRecord, getQRRecord, putQRRecord } from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { isValidRecord, makeRecord, type Draft } from '../lib/qr/record';
import { contentTitle } from '../lib/qr/content';
import { Studio } from '../components/Studio';

export default function Editor() {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = createSignal<'loading' | 'loaded' | 'forbidden' | 'notfound'>('loading');
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [existing, setExisting] = createSignal<{ createdAt: string } | null>(null);
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);

  const publicPath = () => `/${params.handle}/${params.id}`;
  const publicUrl = () => `${location.origin}${publicPath()}`;
  const did = () => profile()?.did;

  createEffect(async () => {
    const handle = params.handle;
    const id = params.id;
    if (!isHandle(handle) || !isRecordKey(id)) {
      setStatus('notfound');
      return;
    }
    if (!authReady()) return;

    const p = profile();
    const a = agent();
    if (!p || !a) {
      setStatus('forbidden');
      return;
    }

    try {
      const actor = await resolveHandle(handle);
      if (actor.did !== p.did) {
        setStatus('forbidden');
        return;
      }
      const item = await getQRRecord(actor.pds, p.did, id);
      if (!item || !isValidRecord(item.record)) {
        setStatus('notfound');
        return;
      }
      setExisting({ createdAt: item.record.createdAt });
      setDraft({ content: item.record.content, style: item.record.style });
      setStatus('loaded');
    } catch (err) {
      console.error(err);
      setStatus('notfound');
    }
  });

  const save = async () => {
    const d = draft();
    const a = agent();
    const p = profile();
    if (!d || !a || !p) return;
    setSaving(true);
    setError('');
    try {
      const record = makeRecord(d, existing() as never);
      await putQRRecord(authedClient(a), p.did, params.id, record);
      navigate(publicPath(), { replace: true });
    } catch (err) {
      console.error(err);
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (!confirm('Delete this QR code? This removes the record from your PDS and breaks its URL.')) return;
    try {
      await deleteQRRecord(authedClient(a), p.did, params.id);
      navigate('/mine');
    } catch (err) {
      console.error(err);
      alert('Could not delete the record.');
    }
  };

  return (
    <main class="mx-auto max-w-6xl px-4 py-8">
      <Show when={status() === 'loading'}>
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      </Show>

      <Show when={status() === 'forbidden'}>
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 class="text-xl font-bold text-slate-900">This isn't your QR code</h1>
          <p class="mt-2 text-sm text-slate-600">
            Only the owner of {params.handle} can edit this code.
          </p>
          <a href="/login" class="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            Sign in
          </a>
        </div>
      </Show>

      <Show when={status() === 'notfound'}>
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 class="text-xl font-bold text-slate-900">QR code not found</h1>
          <A href="/" class="mt-4 inline-block text-sm font-semibold text-sky-600">Go to the studio</A>
        </div>
      </Show>

      <Show when={status() === 'loaded' && draft()}>
        {(d) => (
          <>
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Editing · {contentTitle(d().content)}
                </p>
                <h1 class="truncate text-2xl font-bold text-slate-900">{params.handle}/{params.id}</h1>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving()}
                  class="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving() ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={remove}
                  class="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <Show when={error()}>
              <p class="mb-4 text-sm text-red-600">{error()}</p>
            </Show>

            <Studio draft={d()} onChange={setDraft} savedUrl={publicUrl()} />
          </>
        )}
      </Show>
    </main>
  );
}