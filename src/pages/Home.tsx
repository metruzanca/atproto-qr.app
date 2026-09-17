import { createSignal, Show } from 'solid-js';

import { agent, profile } from '../lib/atproto/auth';
import { authedClient, putQRRecord } from '../lib/atproto/records';
import { randomRkey } from '../lib/atproto/rkey';
import { emptyContent } from '../lib/qr/content';
import { DEFAULT_STYLE } from '../lib/qr/style';
import { makeRecord, type Draft } from '../lib/qr/record';
import { Studio } from '../components/Studio';
import { showToast } from '../components/Toast';

export default function Home() {
  const [draft, setDraft] = createSignal<Draft>({ content: emptyContent('url'), style: { ...DEFAULT_STYLE } });
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  const save = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    setSaving(true);
    setSaveError('');
    try {
      const rkey = randomRkey();
      const record = makeRecord(draft());
      await putQRRecord(authedClient(a), p.did, rkey, record);
      showToast(`Saved — ${location.origin}/${p.handle}/${rkey}`);
    } catch (err) {
      console.error(err);
      setSaveError('Could not save to your PDS. Please try again.');
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

      <Studio draft={draft()} onChange={setDraft} onSave={profile() ? save : undefined} saving={saving()} />
    </main>
  );
}