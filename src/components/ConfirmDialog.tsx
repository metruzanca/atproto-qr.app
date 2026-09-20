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
        class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md dark:bg-black/50"
        onClick={() => props.onCancel()}
        role="presentation"
      >
        <div
          class="animate-pop-in w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_64px_-16px_rgb(2_6_23_/_0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a1120]/95"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <Show when={props.title}>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">{props.title}</h3>
          </Show>
          <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{props.message}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => props.onCancel()} class="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={() => props.onConfirm()} class="btn-primary">
              {props.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}