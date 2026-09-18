import { createEffect, createSignal, Show } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { isHandle, isRecordKey } from '@atcute/lexicons/syntax';

import { agent, authReady, profile } from '../lib/atproto/auth';
import {
  authedClient,
  cascadeDeleteQRRecord,
  createQRRecord,
  deleteRedirectRecord,
  getQRRecord,
  getRedirectRecord,
  listAllNames,
  putQRRecord,
  putRedirectRecord,
  QRNameTakenError,
  uploadFile,
} from '../lib/atproto/records';
import { resolveHandle } from '../lib/atproto/resolve';
import { isValidRecord, makeRecord, type Draft, type QRKind, type QRRecord } from '../lib/qr/record';
import { codeUrl, contentTitle, contentToValue, emptyContent } from '../lib/qr/content';
import { DEFAULT_STYLE } from '../lib/qr/style';
import { generateCodeName, isValidSlug } from '../lib/qr/name';
import { Studio } from '../components/Studio';
import { showToast } from '../components/Toast';

export default function Editor() {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = createSignal<'loading' | 'loaded' | 'forbidden' | 'notfound'>('loading');
  const [mode, setMode] = createSignal<'qr' | 'redirect'>('qr');
  const [kind, setKind] = createSignal<QRKind>('fixed');
  const [redirectTarget, setRedirectTarget] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [existing, setExisting] = createSignal<QRRecord | null>(null);
  const [name, setName] = createSignal('');
  const [nameError, setNameError] = createSignal('');
  const [existingNames, setExistingNames] = createSignal<Set<string>>(new Set());
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [unlocked, setUnlocked] = createSignal(false);

  const publicPath = () => `/${params.handle}/${params.id}`;
  const publicUrl = () => `${location.origin}${publicPath()}`;

  const qrData = () => {
    const d = draft();
    if (!d) return '';
    if (kind() === 'dynamic') {
      return existing()?.qrValue ?? publicUrl();
    }
    const a = agent();
    return contentToValue(d.content, { pdsUrl: a?.session.info.aud, did: profile()?.did });
  };

  const onUploadFile = async (file: File) => {
    const a = agent();
    if (!a) throw new Error('not signed in');
    return uploadFile(a, file);
  };

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
      if (item && isValidRecord(item.record)) {
        setMode('qr');
        setRedirectTarget(null);
        setExisting(item.record);
        setKind(item.record.kind ?? 'fixed');
        setDraft({ content: item.record.content, style: item.record.style });
        setName(id);
      } else {
        const redirect = await getRedirectRecord(actor.pds, p.did, id);
        if (!redirect) {
          setStatus('notfound');
          return;
        }
        setMode('redirect');
        setRedirectTarget(redirect.target);
        setExisting(null);
        setKind('fixed');
        setDraft({ content: emptyContent('url'), style: { ...DEFAULT_STYLE } });
        setName(id);
      }
      setUnlocked(false);
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
    const c = d.content;
    if (c.type === 'file' && !c.fields.blob) {
      setError('Upload a file before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const client = authedClient(a);
      const buildRecord = (): QRRecord => {
        const record = makeRecord(d, existing() ?? undefined);
        record.kind = kind();
        if (kind() === 'dynamic') {
          record.qrValue = codeUrl(p.handle, v);
        }
        return record;
      };
      if (mode() === 'redirect') {
        if (v === params.id) {
          await createQRRecord(client, p.did, params.id, buildRecord());
          await deleteRedirectRecord(client, p.did, params.id);
          showToast('Saved as a QR code');
          navigate(`${publicPath()}/edit`, { replace: true });
        } else {
          const record = buildRecord();
          record.aliases = [params.id];
          await createQRRecord(client, p.did, v, record);
          await putRedirectRecord(client, p.did, params.id, v);
          await cascadeDeleteQRRecord(client, p.did, params.id, []).catch((cleanupErr) => {
            console.warn('failed to remove stale QR record:', cleanupErr);
          });
          showToast(`Renamed to ${v}`);
          navigate(`/${p.handle}/${v}/edit`, { replace: true });
        }
        return;
      }

      if (v === params.id) {
        const record = buildRecord();
        await putQRRecord(client, p.did, params.id, record);
        showToast('Changes saved');
      } else {
        const record = buildRecord();
        record.aliases = [...(existing()?.aliases ?? []), params.id];
        await createQRRecord(client, p.did, v, record);
        try {
          await putRedirectRecord(client, p.did, params.id, v);
        } catch (renameErr) {
          await cascadeDeleteQRRecord(client, p.did, v, []).catch(() => {});
          throw renameErr;
        }
        await cascadeDeleteQRRecord(client, p.did, params.id, []).catch((cleanupErr) => {
          console.warn('failed to remove old QR record:', cleanupErr);
        });
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
    if (mode() === 'redirect') {
      if (!confirm('Delete this redirect? This breaks the old URL it was printed under.')) return;
      try {
        await deleteRedirectRecord(authedClient(a), p.did, params.id);
        navigate('/codes');
      } catch (err) {
        console.error(err);
        alert('Could not delete the redirect.');
      }
      return;
    }
    if (!confirm('Delete this QR code? This removes the code and all of its old links from your Bluesky account, breaking every printed URL for it.')) return;
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
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-500" />
      </Show>

      <Show when={status() === 'forbidden'}>
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">This isn't your QR code</h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Only the owner of {params.handle} can edit this code.
          </p>
          <a href="/login" class="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            Sign in
          </a>
        </div>
      </Show>

      <Show when={status() === 'notfound'}>
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">QR code not found</h1>
          <A href="/" class="mt-4 inline-block text-sm font-semibold text-sky-600">Go to the studio</A>
        </div>
      </Show>

      <Show when={status() === 'loaded' && draft()}>
        {(d) => (
          <>
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Editing · {contentTitle(d().content)}
                </p>
                <h1 class="flex items-center gap-2 truncate text-2xl font-bold text-slate-900 dark:text-white">
                  {params.handle}/{params.id}
                  <Show when={mode() === 'redirect'}>
                    <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      Redirect
                    </span>
                  </Show>
                  <Show when={mode() === 'qr'}>
                    <span
                      class={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        kind() === 'dynamic' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {kind()}
                    </span>
                  </Show>
                </h1>
              </div>
              <button
                type="button"
                onClick={remove}
                class="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>

            <Show when={error()}>
              <p class="mb-4 text-sm text-red-600 dark:text-red-400">{error()}</p>
            </Show>

            <Show when={mode() === 'redirect' && redirectTarget()}>
              <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                This name is currently a <span class="font-semibold">redirect</span> to{' '}
                <span class="font-mono">{redirectTarget()}</span> — it keeps an older printed URL working. Fill in the
                details below and save to turn it back into a QR code.
              </div>
            </Show>

            <Studio
              draft={d()}
              onChange={setDraft}
              kind={kind()}
              onKindChange={mode() === 'redirect' ? setKind : undefined}
              contentLocked={mode() === 'qr' && kind() === 'fixed' && !unlocked()}
              onUnlockContent={() => setUnlocked(true)}
              qrData={qrData()}
              savedUrl={publicUrl()}
              onUploadFile={onUploadFile}
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