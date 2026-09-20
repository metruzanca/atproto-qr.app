import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';

import { profile, signOut } from '../lib/atproto/auth';
import { ThemeMenu } from './ThemeMenu';

const navClass =
  'rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white';

const navActiveClass = 'bg-white/80 text-slate-900 shadow-sm dark:bg-white/[0.1] dark:text-white';

const menuItemClass =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-500/10 dark:text-slate-200 dark:hover:bg-white/[0.06]';

export function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!menuOpen()) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef && !menuRef.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    onCleanup(() => document.removeEventListener('click', onDocClick));
  });

  return (
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#060a13]/70">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <A href="/" class="group flex shrink-0 items-center gap-2.5 font-bold text-slate-900 dark:text-white">
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_4px_14px_-4px_rgb(37_99_235_/_0.6)] transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 12v4a1 1 0 0 1-1 1h-4" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M17 8V7" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M7 17h.01" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span class="hidden tracking-tight sm:inline">
            atproto<span class="text-gradient">QR</span>
          </span>
        </A>

        <nav class="flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/40 p-1 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
          <A href="/" activeClass={navActiveClass} class={navClass}>
            Home
          </A>
          <A href="/codes" inactiveClass="hidden sm:block" activeClass={navActiveClass} class={navClass}>
            My QR codes
          </A>
          <Show when={profile()}>
            <A href="/settings" activeClass={navActiveClass} class={navClass}>
              Settings
            </A>
          </Show>
          <A href="/about" activeClass={navActiveClass} class={navClass}>
            About
          </A>
        </nav>

        <div class="flex shrink-0 items-center gap-2">
          <ThemeMenu />
          <Show
            when={profile()}
            fallback={
              <button type="button" onClick={() => navigate('/login')} class="btn-primary py-2">
                Sign in
              </button>
            }
          >
            {(p) => (
              <div ref={menuRef} class="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  aria-expanded={menuOpen()}
                  aria-haspopup="menu"
                  class="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-500/10 dark:hover:bg-white/[0.06]"
                >
                  <span class="ring-2 ring-white/80 shadow dark:ring-white/10">
                    <img
                      src={p().avatar ?? undefined}
                      alt=""
                      class="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <span class="hidden max-w-24 truncate text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
                    {p().displayName ?? p().handle}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${menuOpen() ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <Show when={menuOpen()}>
                  <div
                    class="animate-pop-in absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_16px_40px_-12px_rgb(2_6_23_/_0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a1120]/95"
                    role="menu"
                    aria-label="Account"
                  >
                    <div class="flex items-center gap-3 px-3 py-2.5">
                      <img
                        src={p().avatar ?? undefined}
                        alt=""
                        class="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {p().displayName ?? p().handle}
                        </p>
                        <p class="truncate text-xs text-slate-500 dark:text-slate-400">{p().handle}</p>
                      </div>
                    </div>
                    <div class="hairline my-1" />
                    <A href="/codes" role="menuitem" onClick={() => setMenuOpen(false)} class={menuItemClass}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                      My QR codes
                    </A>
                    <A href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} class={menuItemClass}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                      </svg>
                      Settings
                    </A>
                    <div class="hairline my-1" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </Show>
              </div>
            )}
          </Show>
        </div>
      </div>
    </header>
  );
}