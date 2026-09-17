import { createEffect, onCleanup, Show } from 'solid-js';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: Props) {
  createEffect(() => {
    if (!props.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    onCleanup(() => document.removeEventListener('keydown', onKeyDown));
  });

  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        onClick={() => props.onCancel()}
        role="presentation"
      >
        <div
          class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <Show when={props.title}>
            <h3 class="text-base font-bold text-slate-900">{props.title}</h3>
          </Show>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{props.message}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => props.onCancel()}
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => props.onConfirm()}
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              {props.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}