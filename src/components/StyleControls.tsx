import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { DotType, CornerDotType, CornerSquareType, ShapeType } from '@liquid-js/qr-code-styling';

import { ERROR_CORRECTION_LEVELS, type QRStyle } from '../lib/qr/style';
import { ColorInput, Field, Select, TextInput, Toggle } from './ui';

const DOT_OPTIONS = Object.values(DotType).map((v) => ({ value: v, label: v }));
const CORNER_SQUARE_OPTIONS = Object.values(CornerSquareType).map((v) => ({ value: v, label: v }));
const CORNER_DOT_OPTIONS = Object.values(CornerDotType).map((v) => ({ value: v, label: v }));

export function StyleControls(props: {
  style: QRStyle;
  onChange: (style: QRStyle) => void;
  defaultProxyOrigin?: string;
}) {
  const s = () => props.style;
  const set = (patch: Partial<QRStyle>) => props.onChange({ ...props.style, ...patch });
  const [needsProxy, setNeedsProxy] = createSignal(false);

  createEffect(() => {
    const url = s().image;
    const proxied = s().imageProxy;
    if (proxied || !url || /^(data|blob):/i.test(url) || !/^https?:\/\//i.test(url)) {
      setNeedsProxy(false);
      return;
    }
    const current = url;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        await fetch(current, { mode: 'cors' });
        if (!cancelled) setNeedsProxy(false);
      } catch {
        if (!cancelled) setNeedsProxy(true);
      }
    }, 400);
    onCleanup(() => {
      cancelled = true;
      clearTimeout(timer);
    });
  });

  return (
    <div class="space-y-4">
      <Field label="Shape">
        <Select
          value={s().shape}
          onChange={(e) => set({ shape: e.currentTarget.value as QRStyle['shape'] })}
          options={Object.values(ShapeType).map((v) => ({ value: v, label: v }))}
        />
      </Field>

      <Field label="Dot style">
        <Select value={s().dotsType} onChange={(e) => set({ dotsType: e.currentTarget.value })} options={DOT_OPTIONS} />
      </Field>

      <Field label="Dot color">
        <ColorInput value={s().dotsColor} onInput={(e) => set({ dotsColor: e.currentTarget.value })} />
      </Field>

      <div class="grid grid-cols-2 gap-3">
        <Field label="Corner square">
          <Select
            value={s().cornersSquareType ?? 'inherit'}
            onChange={(e) =>
              set({ cornersSquareType: e.currentTarget.value === 'inherit' ? null : e.currentTarget.value })
            }
            options={[{ value: 'inherit', label: 'Inherit' }, ...CORNER_SQUARE_OPTIONS]}
          />
        </Field>
        <Field label="Corner square color">
          <ColorInput
            value={s().cornersSquareColor ?? s().dotsColor}
            onInput={(e) => set({ cornersSquareColor: e.currentTarget.value })}
          />
        </Field>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <Field label="Corner dot">
          <Select
            value={s().cornersDotType ?? 'inherit'}
            onChange={(e) =>
              set({ cornersDotType: e.currentTarget.value === 'inherit' ? null : e.currentTarget.value })
            }
            options={[{ value: 'inherit', label: 'Inherit' }, ...CORNER_DOT_OPTIONS]}
          />
        </Field>
        <Field label="Corner dot color">
          <ColorInput
            value={s().cornersDotColor ?? s().dotsColor}
            onInput={(e) => set({ cornersDotColor: e.currentTarget.value })}
          />
        </Field>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <Field label="Background color">
          <ColorInput value={s().backgroundColor} onInput={(e) => set({ backgroundColor: e.currentTarget.value })} />
        </Field>
        <Field label="Margin (blocks)">
          <TextInput
            type="number"
            min={0}
            max={16}
            value={s().backgroundMargin}
            onInput={(e) => set({ backgroundMargin: Math.max(0, Number(e.currentTarget.value) || 0) })}
          />
        </Field>
      </div>

      <Field label="Error correction">
        <Select
          value={s().errorCorrectionLevel}
          onChange={(e) => set({ errorCorrectionLevel: e.currentTarget.value as QRStyle['errorCorrectionLevel'] })}
          options={ERROR_CORRECTION_LEVELS.map((v) => ({
            value: v,
            label: v === 'L' ? 'L — low (7%)' : v === 'M' ? 'M — medium (15%)' : v === 'Q' ? 'Q — quartile (25%)' : 'H — high (30%)',
          }))}
        />
      </Field>

      <Field label="Export size (px)">
        <TextInput
          type="number"
          min={128}
          max={4096}
          step={64}
          value={s().size}
          onInput={(e) => set({ size: Math.max(128, Number(e.currentTarget.value) || 128) })}
        />
      </Field>

      <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Logo</div>
        <Field label="Image (optional)">
          <TextInput
            placeholder="https://… or upload below"
            value={s().image ?? ''}
            onInput={(e) => set({ image: e.currentTarget.value || null })}
          />
        </Field>
        <div class="flex items-center gap-2">
          <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
            Upload image
            <input
              type="file"
              accept="image/*"
              class="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => set({ image: String(reader.result ?? null) });
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <Show when={s().image}>
            <button
              type="button"
              onClick={() => set({ image: null, imageProxy: false, imageProxyUrl: undefined })}
              class="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Remove
            </button>
          </Show>
        </div>
      <Show when={needsProxy()}>
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p>
            This image host blocks direct loading into a QR canvas. Route it through an image proxy so it renders
            (and so downloads still work)?
          </p>
          <button
            type="button"
            onClick={() => set({ imageProxy: true })}
            class="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            Use image proxy
          </button>
        </div>
      </Show>
      <Show when={s().imageProxy && s().image}>
        <div class="space-y-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <p class="text-xs font-medium text-slate-700 dark:text-slate-200">How should the logo be loaded?</p>
          <label class="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="logo-proxy"
              checked={s().imageProxyUrl === undefined}
              onChange={() => set({ imageProxyUrl: undefined })}
              class="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <span>
              <span class="font-medium text-slate-900 dark:text-white">Default proxy</span>
              <span class="block text-xs text-slate-500 dark:text-slate-400">
                {props.defaultProxyOrigin ?? 'images.weserv.nl'}
              </span>
            </span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="logo-proxy"
              checked={s().imageProxyUrl !== undefined}
              onChange={() => set({ imageProxyUrl: '' })}
              class="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <span class="min-w-0 flex-1">
              <span class="block font-medium text-slate-900 dark:text-white">Custom proxy</span>
              <span class="block text-xs text-slate-500 dark:text-slate-400">Enter your own proxy URL</span>
            </span>
          </label>
          <Show when={s().imageProxyUrl !== undefined}>
            <TextInput
              placeholder="https://your-proxy.example.com"
              spellcheck={false}
              value={s().imageProxyUrl ?? ''}
              onInput={(e) => set({ imageProxyUrl: e.currentTarget.value })}
            />
          </Show>
          <button
            type="button"
            onClick={() => set({ imageProxy: false, imageProxyUrl: undefined })}
            class="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
          >
            Remove proxy
          </button>
        </div>
      </Show>
        <div class="grid grid-cols-2 gap-3">
          <Field label="Image margin">
            <TextInput
              type="number"
              min={0}
              max={16}
              value={s().imageMargin}
              onInput={(e) => set({ imageMargin: Math.max(0, Number(e.currentTarget.value) || 0) })}
            />
          </Field>
          <Field label="Image size (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              step={5}
              value={s().imageSize}
              onInput={(e) => set({ imageSize: Math.min(100, Math.max(0, Number(e.currentTarget.value) || 0)) })}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}