import { createEffect, createSignal, Show } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { agent, authReady, profile } from '../lib/atproto/auth';
import {
  authedClient,
  cascadeDeleteQRRecord,
  createQRRecord,
  getQRRecord,
  listAllNames,
  putQRRecord,
  putRedirectRecord,
  QRNameTakenError,
} from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { isValidRecord, makeRecord, type Draft, type QRRecord } from '../lib/qr/record';
import { generateCodeName, isValidSlug } from '../lib/qr/name';
import { contentTitle } from '../lib/qr/content';
import { Studio } from '../components/Studio';
import { showToast } from '../components/Toast';

export default function Editor() {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = createSignal<'loading' | 'loaded' | 'forbidden' | 'notfound'>('loading');
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [existing, setExisting] = createSignal<QRRecord | null>(null);
  const [name, setName] = createSignal('');
  const [nameError, setNameError] = createSignal('');
  const [existingNames, setExistingNames] = createSignal<Set<string>>(new Set());
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);

  const publicPath = () => `/${params.handle}/${params.id}`;
  const publicUrl = () => `${location.origin}${publicPath()}`;

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
      setExisting(item.record);
      setDraft({ content: item.record.content, style: item.record.style });
      setName(id);
      setNameError('');
      const names = await listAllNames(authedClient(a), p.did);
      setExistingNames(new Set(names));
      setStatus('loaded');
    } catch (err) {
      console.error(err);
      setStatus('notfound');
    }
  });

  const validateName = (value: string): string => {
    if (!value) return 'Enter a name';
    if (!isValidSlug(value)) return 'Use lowercase letters, numbers, and hyphens';
    if (value !== params.id && existingNames().has(value)) {
      return `You already have a code named "${value}"`;
    }
    return '';
  };

  const onNameChange = (value: string) => {
    const v = value.toLowerCase();
    setName(v);
    setNameError(validateName(v));
  };

  const generateName = () => {
    const v = generateCodeName(existingNames());
    setName(v);
    setNameError('');
  };

  const save = async () => {
    const d = draft();
    const a = agent();
    const p = profile();
    const v = name().trim();
    const err = validateName(v);
    setNameError(err);
    if (!d || !a || !p || err) return;
    setSaving(true);
    setError('');
    try {
      if (v === params.id) {
        const record = makeRecord(d, existing() ?? undefined);
        await putQRRecord(authedClient(a), p.did, params.id, record);
        showToast('Changes saved');
      } else {
        const record = makeRecord(d, existing() ?? undefined);
        record.aliases = [...(existing()?.aliases ?? []), params.id];
        await createQRRecord(authedClient(a), p.did, v, record);
        try {
          await putRedirectRecord(authedClient(a), p.did, params.id, v);
        } catch (renameErr) {
          await cascadeDeleteQRRecord(authedClient(a), p.did, v, []).catch(() => {});
          throw renameErr;
        }
        setExistingNames((prev) => new Set(prev).add(v));
        showToast(`Renamed to ${v}`);
        navigate(`/${p.handle}/${v}/edit`, { replace: true });
      }
    } catch (err) {
      if (err instanceof QRNameTakenError) {
        setNameError(err.message);
      } else {
        console.error(err);
        setError('Could not save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (!confirm('Delete this QR code? This removes the record and all of its redirect records from your PDS, breaking every printed URL for it.')) return;
    try {
      await cascadeDeleteQRRecord(authedClient(a), p.did, params.id, existing()?.aliases ?? []);
      navigate('/codes');
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
              <button
                type="button"
                onClick={remove}
                class="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>

            <Show when={error()}>
              <p class="mb-4 text-sm text-red-600">{error()}</p>
            </Show>

            <Studio
              draft={d()}
              onChange={setDraft}
              savedUrl={publicUrl()}
              onSave={save}
              saving={saving()}
              name={name()}
              onNameChange={onNameChange}
              onGenerateName={generateName}
              nameError={nameError()}
            />
          </>
        )}
      </Show>
    </main>
  );
}