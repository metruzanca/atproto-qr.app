import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { isHandle } from '@atcute/lexicons/syntax';

import { profile, searchActors, signIn } from '../lib/atproto/auth';
import { Field, TextInput } from '../components/ui';

interface Suggestion {
  handle: string;
  displayName: string | null;
  avatar: string | null;
}

export default function Login() {
  const [handle, setHandle] = createSignal('');
  const [error, setError] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [suggestions, setSuggestions] = createSignal<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [focused, setFocused] = createSignal(false);
  const [selected, setSelected] = createSignal<Suggestion | null>(null);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;
  let suppressNextSearch = false;

  const open = () => focused() && suggestions().length > 0;

  createEffect(() => {
    const q = handle().trim();
    if (timer) clearTimeout(timer);
    setActiveIndex(-1);
    if (suppressNextSearch) {
      suppressNextSearch = false;
      setSuggestions([]);
      return;
    }
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    timer = setTimeout(async () => {
      const current = ++seq;
      const results = await searchActors(q);
      if (current === seq) {
        setSuggestions(results);
      }
    }, 250);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });

  const select = (s: Suggestion) => {
    suppressNextSearch = true;
    setSelected(s);
    setHandle(s.handle);
    setSuggestions([]);
    setActiveIndex(-1);
    setError('');
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const list = suggestions();
    if (list.length === 0 || !focused()) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      const idx = activeIndex();
      if (idx >= 0 && list[idx]) {
        e.preventDefault();
        select(list[idx]);
      }
    }
  };

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
                <div class="relative">
                  <Show when={selected()?.avatar}>
                    <img
                      src={selected()!.avatar ?? undefined}
                      alt=""
                      class="pointer-events-none absolute left-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-200"
                    />
                  </Show>
                  <TextInput
                    placeholder="alice.bsky.social"
                    autocomplete="off"
                    class={selected() ? 'pl-10' : undefined}
                    value={handle()}
                    onInput={(e) => {
                      setSelected(null);
                      setHandle(e.currentTarget.value);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onKeyDown}
                  />
                  <Show when={open()}>
                    <ul
                      class="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                      role="listbox"
                    >
                      <For each={suggestions()}>
                        {(s, i) => (
                          <li
                            role="option"
                            aria-selected={activeIndex() === i()}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveIndex(i())}
                            onClick={() => select(s)}
                            class={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                              activeIndex() === i() ? 'bg-sky-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <Show when={s.avatar}>
                              <img
                                src={s.avatar ?? undefined}
                                alt=""
                                class="h-7 w-7 rounded-full bg-slate-200"
                                referrerPolicy="no-referrer"
                              />
                            </Show>
                            <div class="min-w-0">
                              <p class="truncate text-sm font-semibold text-slate-900">{s.handle}</p>
                              <Show when={s.displayName}>
                                <p class="truncate text-xs text-slate-500">{s.displayName}</p>
                              </Show>
                            </div>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>
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