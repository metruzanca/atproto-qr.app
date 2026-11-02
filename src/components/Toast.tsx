import { createSignal, Show } from 'solid-js';

export type ToastVariant = 'success' | 'error';

const [message, setMessage] = createSignal<{ text: string; variant: ToastVariant } | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string, variant: ToastVariant = 'success'): void {
  setMessage({ text, variant });
  clearTimeout(timer);
  timer = setTimeout(() => setMessage(null), variant === 'error' ? 5000 : 3000);
}

export function ToastContainer() {
  return (
    <Show when={message()}>
      {(toast) => (
        <div
          role={toast().variant === 'error' ? 'alert' : 'status'}
          aria-live={toast().variant === 'error' ? 'assertive' : 'polite'}
          class={`animate-toast-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border py-2.5 pl-3 pr-5 text-sm font-medium shadow-[0_12px_32px_-8px_rgb(2_6_23_/_0.6)] backdrop-blur-xl ${
            toast().variant === 'error'
              ? 'border-rose-500/40 bg-slate-900/90 text-white ring-1 ring-rose-500/30 dark:border-rose-500/40 dark:bg-white/90 dark:text-slate-900 dark:shadow-[0_12px_32px_-8px_rgb(0_0_0_/_0.4)]'
              : 'border-white/10 bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 dark:shadow-[0_12px_32px_-8px_rgb(0_0_0_/_0.4)]'
          }`}
        >
          <span
            class={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-white ${
              toast().variant === 'error' ? 'from-rose-500 to-red-600' : 'from-sky-500 to-blue-600'
            }`}
          >
            <Show
              when={toast().variant === 'error'}
              fallback={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
                <path d="M12 7.5v6" />
                <path d="M12 17h.01" />
              </svg>
            </Show>
          </span>
          {toast().text}
        </div>
      )}
    </Show>
  );
}
