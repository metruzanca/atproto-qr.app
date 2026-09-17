import { createEffect, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { agent, profile } from '../lib/atproto/auth';
import { authedClient, createQRRecord, listAllNames, QRNameTakenError } from '../lib/atproto/records';
import { emptyContent } from '../lib/qr/content';
import { generateCodeName, isValidSlug } from '../lib/qr/name';
import { DEFAULT_STYLE } from '../lib/qr/style';
import { makeRecord, type Draft } from '../lib/qr/record';
import { Studio } from '../components/Studio';

export default function Home() {
  const navigate = useNavigate();
  const [draft, setDraft] = createSignal<Draft>({ content: emptyContent('url'), style: { ...DEFAULT_STYLE } });
  const [name, setName] = createSignal('');
  const [nameError, setNameError] = createSignal('');
  const [existingKeys, setExistingKeys] = createSignal<Set<string>>(new Set());
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  createEffect(() => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    listAllNames(authedClient(a), p.did)
      .then((keys) => setExistingKeys(new Set(keys)))
      .catch((err) => console.warn('failed to load existing keys:', err));
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

  const save = async () => {
    const a = agent();
    const p = profile();
    const v = name().trim();
    const err = validateName(v);
    setNameError(err);
    if (!a || !p || err) return;
    setSaving(true);
    setSaveError('');
    try {
      const record = makeRecord(draft());
      await createQRRecord(authedClient(a), p.did, v, record);
      setExistingKeys((prev) => new Set(prev).add(v));
      navigate(`/${p.handle}/${v}/edit`, { replace: true });
    } catch (err) {
      if (err instanceof QRNameTakenError) {
        setNameError(err.message);
      } else {
        console.error(err);
        setSaveError('Could not save to your PDS. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main class="mx-auto max-w-6xl px-4 py-8">
      <section class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Beautiful QR codes, designed and yours.
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Style a QR code in seconds, download it anywhere — or sign in with your atproto account to create
          <span class="font-semibold text-slate-800"> editable</span> codes that live in your own personal data server.
        </p>
      </section>

      <Show when={saveError()}>
        <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError()}</p>
      </Show>

      <Studio
        draft={draft()}
        onChange={setDraft}
        onSave={profile() ? save : undefined}
        saving={saving()}
        name={name()}
        onNameChange={onNameChange}
        onGenerateName={generateName}
        nameError={nameError()}
      />
    </main>
  );
}