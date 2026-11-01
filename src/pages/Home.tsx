import { createEffect, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { agent, profile, authReady } from '../lib/atproto/auth';
import { authedClient, createQRRecord, listAllNames, QRNameTakenError, uploadFile } from '../lib/atproto/records';
import { codePath, codeUrl, contentToValue, emptyContent } from '../lib/qr/content';
import { generateCodeName, isValidSlug } from '../lib/qr/name';
import { DEFAULT_STYLE } from '../lib/qr/style';
import { draftFromParams, draftToParams, makeRecord, type Draft, type QRKind } from '../lib/qr/record';
import { globalAnalytics, type QRCodeTracking } from '../lib/qr/tracking';
import { Studio } from '../components/Studio';
import { UsageGuide } from '../components/UsageGuide';
import { SelfHosting } from '../components/SelfHosting';
import { PERSONAL_MODE } from '../lib/personal';

function readDraftFromUrl(): Draft | null {
  const params = new URLSearchParams(location.search);
  if (params.toString() === '') return null;
  return draftFromParams(params);
}

export default function Home() {
  const navigate = useNavigate();
  const [draft, setDraft] = createSignal<Draft>(readDraftFromUrl() ?? { content: emptyContent('url'), style: { ...DEFAULT_STYLE } });
  const [kind, setKind] = createSignal<QRKind>('fixed');
  const [name, setName] = createSignal('');
  const [nameError, setNameError] = createSignal('');
  const [existingKeys, setExistingKeys] = createSignal<Set<string>>(new Set());
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');
  const [tracking, setTracking] = createSignal<QRCodeTracking | undefined>(undefined);

  // A signed-in owner of a personal instance already knows all this: skip the
  // marketing guide and make the page feel like an app. Everyone else (strangers
  // on a personal instance, any visitor elsewhere) still gets the full tour.
  const showGuide = () => !PERSONAL_MODE || (authReady() && !profile());

  createEffect(() => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    listAllNames(authedClient(a), p.did)
      .then((keys) => setExistingKeys(new Set(keys)))
      .catch((err) => console.warn('failed to load existing keys:', err));
  });

  createEffect(() => {
    if (kind() !== 'fixed') return;
    const params = draftToParams(draft());
    const current = new URLSearchParams(location.search);
    if (current.toString() === params.toString()) return;
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
  });

  const validateName = (value: string): string => {
    if (!value) return 'Enter a name';
    if (!isValidSlug(value)) return 'Use lowercase letters, numbers, and hyphens';
    if (existingKeys().has(value)) return `You already have a code named "${value}"`;
    return '';
  };

  const onNameChange = (value: string) => {
    const v = value.toLowerCase();
    setName(v);
    setNameError(validateName(v));
  };

  const generateName = () => {
    const v = generateCodeName(existingKeys());
    setName(v);
    setNameError('');
  };

  const onKindChange = (k: QRKind) => {
    setKind(k);
    if (k === 'dynamic' && profile() && !name()) {
      generateName();
    }
  };

  const qrData = () => {
    const handle = profile()?.handle;
    const v = name().trim();
    const c = draft().content;
    if (kind() === 'dynamic' || c.type === 'file') {
      return handle && isValidSlug(v) ? codeUrl(handle, v) : '';
    }
    const a = agent();
    return contentToValue(draft().content, { pdsUrl: a?.session.info.aud, did: profile()?.did });
  };

  const onUploadFile = async (file: File) => {
    const a = agent();
    if (!a) throw new Error('not signed in');
    return uploadFile(a, file);
  };

  const save = async () => {
    const a = agent();
    const p = profile();
    const v = name().trim();
    const err = validateName(v);
    setNameError(err);
    if (!a || !p || err) return;
    const c = draft().content;
    if (c.type === 'file' && !c.fields.blob) {
      setSaveError('Upload a file before saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const record = makeRecord(draft());
      record.kind = kind();
      if (kind() === 'dynamic' || c.type === 'file') {
        record.qrValue = qrData();
      }
      if (kind() === 'dynamic') {
        record.tracking = tracking();
      }
      await createQRRecord(authedClient(a), p.did, v, record);
      setExistingKeys((prev) => new Set(prev).add(v));
      navigate(codePath(p.handle, v, { edit: true }), { replace: true });
    } catch (err) {
      if (err instanceof QRNameTakenError) {
        setNameError(err.message);
      } else {
        console.error(err);
        setSaveError('Could not save to your account. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // A plain `#ideas` anchor would collide with personal-instance code links
  // (`/#name`), so scroll to the guide explicitly instead.
  const scrollToIdeas = () => {
    const el = document.getElementById('ideas');
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <main class="mx-auto max-w-6xl px-4">
      <div class="flex min-h-[calc(100svh-6.5rem)] flex-col justify-center pt-8">
        <section class="animate-fade-up text-center">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Beautiful QR codes, <span class="text-gradient">designed and yours.</span>
          </h1>
          <p class="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Style a QR code in seconds, download it anywhere, or sign in to save it as a{' '}
            <span class="font-semibold text-slate-800 dark:text-slate-100">fixed</span> or{' '}
            <span class="font-semibold text-slate-800 dark:text-slate-100">dynamic</span> code that lives on your own Bluesky account.
          </p>
          <Show when={showGuide()}>
            <button
              type="button"
              onClick={scrollToIdeas}
              class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:underline dark:text-sky-400"
            >
              Need inspiration? See ideas &amp; tips
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4 animate-bounce-soft"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </Show>
        </section>

        <Show when={saveError()}>
          <p class="mb-4 mt-6 rounded-xl border border-red-200/80 bg-red-500/10 px-4 py-3 text-sm text-red-700 backdrop-blur dark:border-red-500/30 dark:text-red-400">{saveError()}</p>
        </Show>

        <div class="mt-6 animate-fade-up delay-150">
          <Studio
            draft={draft()}
            onChange={setDraft}
            kind={kind()}
            onKindChange={onKindChange}
            qrData={qrData()}
            loginHref="/login"
            onUploadFile={profile() ? onUploadFile : undefined}
            emptyHint={
              kind() === 'dynamic'
                ? profile()
                  ? 'Enter a name to see the dynamic QR. It encodes the link to this page, not your data.'
                  : 'Sign in to save a dynamic code. It encodes a link back to this app.'
                : undefined
            }
            onSave={profile() ? save : undefined}
            saving={saving()}
            name={name()}
            onNameChange={onNameChange}
            onGenerateName={generateName}
            nameError={nameError()}
            tracking={tracking()}
            onTrackingChange={setTracking}
            globalAnalytics={globalAnalytics()}
          />
        </div>
      </div>

      <Show when={showGuide()}>
        <UsageGuide />
      </Show>

      {/* A personal instance is already self-hosted, so skip the pitch. */}
      <Show when={!PERSONAL_MODE}>
        <SelfHosting />
      </Show>
    </main>
  );
}