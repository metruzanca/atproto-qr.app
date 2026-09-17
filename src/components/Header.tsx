import { Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';

import { profile, signOut } from '../lib/atproto/auth';

export function Header() {
  const navigate = useNavigate();

  return (
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <A href="/" class="flex items-center gap-2 font-bold text-slate-900">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="7" height="7" rx="1" />
              <rect x="13" y="4" width="7" height="7" rx="1" />
              <rect x="4" y="13" width="7" height="7" rx="1" />
              <rect x="13" y="13" width="7" height="7" rx="1" />
            </svg>
          </span>
          <span>atproto<span class="text-sky-600">QR</span></span>
        </A>

        <nav class="flex items-center gap-1">
          <A
            href="/mine"
            inactiveClass="hidden sm:block"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            My QR codes
          </A>
          <Show
            when={profile()}
            fallback={
              <button
                type="button"
                onClick={() => navigate('/login')}
                class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Sign in
              </button>
            }
          >
            {(p) => (
              <div class="flex items-center gap-2">
                <A
                  href="/mine"
                  class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100"
                >
                  <img
                    src={p().avatar ?? undefined}
                    alt=""
                    class="h-7 w-7 rounded-full bg-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <span class="max-w-32 truncate text-sm font-medium text-slate-700">
                    {p().displayName ?? p().handle}
                  </span>
                </A>
                <button
                  type="button"
                  onClick={() => signOut()}
                  class="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  title="Sign out"
                >
                  Sign out
                </button>
              </div>
            )}
          </Show>
        </nav>
      </div>
    </header>
  );
}