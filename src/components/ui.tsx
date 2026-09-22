import { splitProps, type JSX } from 'solid-js';

const inputClass =
  'w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-sky-400 dark:focus:bg-white/[0.08]';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400';

export function Field(props: { label: string; hint?: string; children: JSX.Element }) {
  return (
    <label class="block">
      <span class={labelClass}>{props.label}</span>
      {props.children}
      {props.hint ? <span class="mt-1 block text-xs text-slate-400 dark:text-slate-500">{props.hint}</span> : null}
    </label>
  );
}

export function TextInput(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ['class']);
  return <input {...rest} class={`${inputClass} ${local.class ?? ''}`} />;
}

export function Textarea(props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [local, rest] = splitProps(props, ['class']);
  return <textarea {...rest} rows={rest.rows ?? 3} class={`${inputClass} ${local.class ?? ''}`} />;
}

export function Select(props: JSX.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const [local, rest] = splitProps(props, ['options', 'class', 'value']);
  return (
    <div class="relative">
      <select {...rest} value={local.value} class={`${inputClass} appearance-none pr-9 ${local.class ?? ''}`}>
        {local.options.map((o) => (
          <option
            value={o.value}
            selected={o.value === local.value}
            class="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          >
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function ColorInput(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <div class={`flex items-center gap-2 ${local.class ?? ''}`}>
      <input
        type="color"
        {...rest}
        class="h-9 w-12 cursor-pointer rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.05]"
      />
      <input
        type="text"
        value={String(props.value ?? '')}
        onInput={props.onInput}
        class={`${inputClass} font-mono`}
        spellcheck={false}
      />
    </div>
  );
}

export function Toggle(props: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
      class={`flex items-center gap-2 text-sm text-slate-700 ${props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} dark:text-slate-200`}
    >
      <span
        class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          props.checked
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_2px_10px_-2px_rgb(37_99_235_/_0.5)]'
            : 'bg-slate-200 dark:bg-white/10'
        }`}
      >
        <span
          class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            props.checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      {props.label}
    </button>
  );
}

export function Segmented(props: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      class={`inline-flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-white/60 p-1 shadow-sm backdrop-blur ${
        props.disabled ? 'opacity-60' : ''
      } dark:border-white/10 dark:bg-white/[0.04]`}
    >
      {props.options.map((o) => (
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.onChange(o.value)}
          class={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
            props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${
            props.value === o.value
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_2px_10px_-2px_rgb(37_99_235_/_0.5)]'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}