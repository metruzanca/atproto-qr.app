import { createSignal, Show } from 'solid-js';
import { isHandle } from '@atcute/lexicons/syntax';

import { profile, signIn } from '../lib/atproto/auth';
import { Field, TextInput } from '../components/ui';

export default function Login() {
  const [handle, setHandle] = createSignal('');
  const [error, setError] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const value = handle().trim();
    if (!isHandle(value)) {
      setError('That does not look like a valid handle. Try e.g. alice.bsky.social');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signIn(value);
    } catch (err) {
      console.error(err);
      setError('Could not start sign-in. Please try again.');
      setBusy(false);
    }
  };

  return (
    <main class="mx-auto max-w-md px-4 py-16">
      <Show
        when={profile()}
        fallback={
          <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 class="text-2xl font-bold text-slate-900">Sign in with atproto</h1>
            <p class="mt-2 text-sm text-slate-600">
              Enter your handle (e.g. <span class="font-mono">alice.bsky.social</span>). You'll be redirected to your
              provider to authorize this app. Your QR codes are stored as records in{' '}
              <span class="font-semibold">your</span> personal data server — not on our servers.
            </p>
            <form class="mt-6 space-y-4" onSubmit={submit}>
              <Field label="Handle">
                <TextInput
                  placeholder="alice.bsky.social"
                  autocomplete="username"
                  value={handle()}
                  onInput={(e) => setHandle(e.currentTarget.value)}
                />
              </Field>
              <Show when={error()}>
                <p class="text-sm text-red-600">{error()}</p>
              </Show>
              <button
                type="submit"
                disabled={busy()}
                class="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
              >
                {busy() ? 'Redirecting…' : 'Continue'}
              </button>
            </form>
          </div>
        }
      >
        {(p) => (
          <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p class="text-sm text-slate-600">
              You're signed in as <span class="font-semibold text-slate-900">{p().handle}</span>.
            </p>
            <a href="/codes" class="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
              Go to my QR codes
            </a>
          </div>
        )}
      </Show>
    </main>
  );
}