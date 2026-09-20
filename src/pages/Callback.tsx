import { createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { finalizeOAuthCallback } from '../lib/atproto/auth';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = createSignal('');

  onMount(async () => {
    try {
      await finalizeOAuthCallback();
      navigate('/codes', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Sign-in failed. The authorization may have expired — please try again.');
    }
  });

  return (
    <main class="mx-auto max-w-md px-4 py-24 text-center">
      <Show
        when={error()}
        fallback={
          <div>
            <div class="spinner h-10 w-10" />
            <p class="mt-4 text-sm text-slate-600 dark:text-slate-300">Completing sign-in…</p>
          </div>
        }
      >
        <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>
        <a href="/login" class="mt-4 inline-block text-sm font-semibold text-sky-600 dark:text-sky-400">
          Try again
        </a>
      </Show>
    </main>
  );
}