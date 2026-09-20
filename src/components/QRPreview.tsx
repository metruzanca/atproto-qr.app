import { createEffect, onCleanup, Show, type JSX } from 'solid-js';
import { QRCodeStyling } from '@liquid-js/qr-code-styling';

import { styleToOptions, type QRStyle } from '../lib/qr/style';

interface Props {
  data: string;
  style: QRStyle;
  proxyOrigin?: string;
  class?: string;
  emptyHint?: string;
  onReady?: (qr: QRCodeStyling) => void;
}

export function QRPreview(props: Props): JSX.Element {
  let container: HTMLDivElement | undefined;
  let qr: QRCodeStyling | undefined;

  createEffect(() => {
    const data = props.data;
    const origin = props.proxyOrigin;
    if (!container) return;

    if (!data) {
      if (qr) {
        container.textContent = '';
        qr = undefined;
      }
      return;
    }

    if (!qr) {
      qr = new QRCodeStyling(styleToOptions(props.style, data, origin));
      qr.append(container);
      props.onReady?.(qr);
    } else {
      qr.update(styleToOptions(props.style, data, origin));
    }
  });

  onCleanup(() => {
    if (container) container.textContent = '';
  });

  return (
    <div class={`relative ${props.class ?? ''}`}>
      <div ref={container} class={props.data ? 'animate-scale-in' : ''} />
      <Show when={!props.data}>
        <div class="flex min-h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/70 px-6 py-10 text-center text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5 opacity-70"
            aria-hidden="true"
          >
            <path d="M4 6a2 2 0 0 1 2-2h2" />
            <path d="M4 18a2 2 0 0 0 2 2h2" />
            <path d="M20 6a2 2 0 0 0-2-2h-2" />
            <path d="M20 18a2 2 0 0 1-2 2h-2" />
            <path d="M7 12h.01" />
            <path d="M12 12h.01" />
            <path d="M17 12h.01" />
            <path d="M7 16h.01" />
            <path d="M12 16h.01" />
            <path d="M12 7h.01" />
            <path d="M17 7h.01" />
          </svg>
          <span>{props.emptyHint ?? 'Fill in some content to see your QR code.'}</span>
        </div>
      </Show>
    </div>
  );
}