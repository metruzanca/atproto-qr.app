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
      <div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        {message()}
      </div>
    </Show>
  );
}