import { createEffect, createSignal, For, onCleanup, Show, type JSX } from 'solid-js';

import { effectiveTheme, setTheme, theme, type Theme } from '../lib/theme';

interface Option {
  value: Theme;
  label: string;
  icon: JSX.Element;
}

const iconClass = 'h-4 w-4';

const OPTIONS: Option[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export function ThemeMenu() {
  const [open, setOpen] = createSignal(false);
  let container: HTMLDivElement | undefined;

  createEffect(() => {
    if (!open()) return;
    const onDocClick = (e: MouseEvent) => {
      if (container && !container.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    onCleanup(() => document.removeEventListener('click', onDocClick));
  });

  return (
    <div ref={container} class="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Theme"
        title="Theme"
        class="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
      >
        <Show when={effectiveTheme() === 'dark'} fallback={OPTIONS[0].icon}>
          {OPTIONS[1].icon}
        </Show>
      </button>

      <Show when={open()}>
        <div class="animate-pop-in absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_16px_40px_-12px_rgb(2_6_23_/_0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a1120]/95">
          <For each={OPTIONS}>
            {(o) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(o.value);
                  setOpen(false);
                }}
                class={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  theme() === o.value
                    ? 'bg-gradient-to-r from-sky-500/15 to-blue-600/15 text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 hover:bg-slate-500/10 dark:text-slate-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span class="flex items-center gap-2">
                  {o.icon}
                  {o.label}
                </span>
                <Show when={theme() === o.value}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}