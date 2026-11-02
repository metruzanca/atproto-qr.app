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
import { codePath, codeUrl, contentTitle, contentToValue, emptyContent } from '../lib/qr/content';
import { PERSONAL_MODE } from '../lib/personal';
import { DEFAULT_STYLE } from '../lib/qr/style';
import { generateCodeName, isValidSlug } from '../lib/qr/name';
import { globalAnalytics, type QRCodeTracking } from '../lib/qr/tracking';
import { Studio } from '../components/Studio';
import { showToast } from '../components/Toast';

export default function Editor(props: { code?: { handle: string; id: string } }) {
  const params = useParams<{ handle: string; id: string }>();
  const navigate = useNavigate();
  const target = () => props.code ?? { handle: params.handle, id: params.id };

  const [status, setStatus] = createSignal<'loading' | 'loaded' | 'forbidden' | 'notfound'>('loading');
  const [mode, setMode] = createSignal<'qr' | 'redirect'>('qr');
  const [kind, setKind] = createSignal<QRKind>('fixed');
  const [redirectTarget, setRedirectTarget] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [existing, setExisting] = createSignal<QRRecord | null>(null);
  const [name, setName] = createSignal('');
  const [nameError, setNameError] = createSignal('');
  const [existingNames, setExistingNames] = createSignal<Set<string>>(new Set());
  const [saving, setSaving] = createSignal(false);
  const [unlocked, setUnlocked] = createSignal(false);
  const [tracking, setTracking] = createSignal<QRCodeTracking | undefined>(undefined);

  const publicUrl = () => codeUrl(target().handle, target().id);

  const qrData = () => {
    const d = draft();
    if (!d) return '';
    if (kind() === 'dynamic' || d.content.type === 'file') {
      return existing()?.qrValue ?? publicUrl();
    }
    const a = agent();
    return contentToValue(d.content, { pdsUrl: a?.session.info.aud, did: profile()?.did });
  };

  const editingLabel = () => {
    const d = draft();
    if (!d) return '';
    if (mode() === 'qr' && (kind() === 'dynamic' || d.content.type === 'file')) {
      return qrData().replace(/^https?:\/\//, '');
    }
    return contentTitle(d.content);
  };

  const onUploadFile = async (file: File) => {
    const a = agent();
    if (!a) throw new Error('not signed in');
    return uploadFile(a, file);
  };

  createEffect(async () => {
    const { handle, id } = target();
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
        setTracking(item.record.tracking);
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
        setTracking(undefined);
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
    if (value !== target().id && existingNames().has(value)) {
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
    const current = target().id;
    const v = name().trim();
    const err = validateName(v);
    setNameError(err);
    if (!d || !a || !p || err) return;
    const c = d.content;
    if (c.type === 'file' && !c.fields.blob) {
      showToast('Upload a file before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const client = authedClient(a);
      const buildRecord = (): QRRecord => {
        const record = makeRecord(d, existing() ?? undefined);
        record.kind = kind();
        if (kind() === 'dynamic' || c.type === 'file') {
          record.qrValue = codeUrl(p.handle, v);
        }
        if (kind() === 'dynamic') {
          record.tracking = tracking();
        }
        return record;
      };
      if (mode() === 'redirect') {
        if (v === current) {
          await createQRRecord(client, p.did, current, buildRecord());
          await deleteRedirectRecord(client, p.did, current);
          showToast('Saved as a QR code');
          navigate(codePath(p.handle, current, { edit: true }), { replace: true });
        } else {
          const record = buildRecord();
          record.aliases = [current];
          await createQRRecord(client, p.did, v, record);
          await putRedirectRecord(client, p.did, current, v);
          await cascadeDeleteQRRecord(client, p.did, current, []).catch((cleanupErr) => {
            console.warn('failed to remove stale QR record:', cleanupErr);
          });
          showToast(`Renamed to ${v}`);
          navigate(codePath(p.handle, v, { edit: true }), { replace: true });
        }
        return;
      }

      if (v === current) {
        const record = buildRecord();
        await putQRRecord(client, p.did, current, record);
        showToast('Changes saved');
      } else {
        const record = buildRecord();
        record.aliases = [...(existing()?.aliases ?? []), current];
        await createQRRecord(client, p.did, v, record);
        try {
          await putRedirectRecord(client, p.did, current, v);
        } catch (renameErr) {
          await cascadeDeleteQRRecord(client, p.did, v, []).catch(() => {});
          throw renameErr;
        }
        await cascadeDeleteQRRecord(client, p.did, current, []).catch((cleanupErr) => {
          console.warn('failed to remove old QR record:', cleanupErr);
        });
        setExistingNames((prev) => new Set(prev).add(v));
        showToast(`Renamed to ${v}`);
        navigate(codePath(p.handle, v, { edit: true }), { replace: true });
      }
    } catch (err) {
      if (err instanceof QRNameTakenError) {
        setNameError(err.message);
      } else {
        console.error(err);
        showToast('Could not save changes. Please try again.', 'error');
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
        await deleteRedirectRecord(authedClient(a), p.did, target().id);
        navigate('/codes');
      } catch (err) {
        console.error(err);
        alert('Could not delete the redirect.');
      }
      return;
    }
    if (!confirm('Delete this QR code? This removes the code and all of its old links from your Bluesky account, breaking every printed URL for it.')) return;
    try {
      await cascadeDeleteQRRecord(authedClient(a), p.did, target().id, existing()?.aliases ?? []);
      navigate('/codes');
    } catch (err) {
      console.error(err);
      alert('Could not delete the record.');
    }
  };

  return (
    <main class="mx-auto max-w-6xl px-4 py-8">
      <Show when={status() === 'loading'}>
        <div class="spinner" />
      </Show>

      <Show when={status() === 'forbidden'}>
        <div class="card p-10 text-center">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">This isn't your QR code</h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Only the owner of {target().handle} can edit this code.
          </p>
          <a href="/login" class="btn-primary mt-4 inline-block">
            Sign in
          </a>
        </div>
      </Show>

      <Show when={status() === 'notfound'}>
        <div class="card p-10 text-center">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">QR code not found</h1>
          <A href="/" class="mt-4 inline-block text-sm font-semibold text-sky-600 dark:text-sky-400">Go to the studio</A>
        </div>
      </Show>

      <Show when={status() === 'loaded' && draft()}>
        {(d) => (
          <>
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Editing · <span class="normal-case">{editingLabel()}</span>
                </p>
                <h1 class="mt-1 flex flex-wrap items-center gap-2 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {PERSONAL_MODE ? `#${target().id}` : `${target().handle}/${target().id}`}
                  <Show when={mode() === 'redirect'}>
                    <span class="badge bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      Redirect
                    </span>
                  </Show>
                  <Show when={mode() === 'qr'}>
                    <span
                      class={`badge ${
                        kind() === 'dynamic' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {kind()}
                    </span>
                  </Show>
                </h1>
              </div>
              <button type="button" onClick={remove} class="btn-danger shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            </div>

            <Show when={mode() === 'redirect' && redirectTarget()}>
              <div class="mb-4 rounded-xl border border-amber-200/80 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 backdrop-blur dark:border-amber-500/30 dark:text-amber-200">
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
              onFileUploaded={() => {
                if (!saving()) void save();
              }}
              onSave={save}
              saving={saving()}
              name={name()}
              onNameChange={onNameChange}
              onGenerateName={generateName}
              nameError={nameError()}
              tracking={tracking()}
              onTrackingChange={setTracking}
              globalAnalytics={globalAnalytics()}
            />
          </>
        )}
      </Show>
    </main>
  );
}