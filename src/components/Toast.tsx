import { createSignal, Show } from 'solid-js';

const [message, setMessage] = createSignal<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string): void {
  setMessage(text);
  clearTimeout(timer);
  timer = setTimeout(() => setMessage(null), 3000);
}

export function ToastContainer() {
  return (
    <Show when={message()}>
      <div class="animate-toast-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/10 bg-slate-900/90 py-2.5 pl-3 pr-5 text-sm font-medium text-white shadow-[0_12px_32px_-8px_rgb(2_6_23_/_0.6)] backdrop-blur-xl dark:bg-white/90 dark:text-slate-900 dark:shadow-[0_12px_32px_-8px_rgb(0_0_0_/_0.4)]">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        {message()}
      </div>
    </Show>
  );
}