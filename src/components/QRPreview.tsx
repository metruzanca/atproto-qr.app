import { createEffect, onCleanup, Show, type JSX } from 'solid-js';
import { QRCodeStyling } from '@liquid-js/qr-code-styling';

import { styleToOptions, type QRStyle } from '../lib/qr/style';

interface Props {
  data: string;
  style: QRStyle;
  class?: string;
  emptyHint?: string;
  onReady?: (qr: QRCodeStyling) => void;
}

export function QRPreview(props: Props): JSX.Element {
  let container: HTMLDivElement | undefined;
  let qr: QRCodeStyling | undefined;

  createEffect(() => {
    const data = props.data;
    if (!container) return;

    if (!data) {
      if (qr) {
        container.textContent = '';
        qr = undefined;
      }
      return;
    }

    if (!qr) {
      qr = new QRCodeStyling(styleToOptions(props.style, data));
      qr.append(container);
      props.onReady?.(qr);
    } else {
      qr.update(styleToOptions(props.style, data));
    }
  });

  onCleanup(() => {
    if (container) container.textContent = '';
  });

  return (
    <div ref={container} class={props.class}>
      <Show when={!props.data}>
        <div class="flex h-full min-h-64 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          {props.emptyHint ?? 'Fill in some content to see your QR code.'}
        </div>
      </Show>
    </div>
  );
}