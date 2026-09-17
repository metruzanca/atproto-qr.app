import { splitProps, type JSX } from 'solid-js';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60';

export function Field(props: { label: string; hint?: string; children: JSX.Element }) {
  return (
    <label class="block">
      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {props.label}
      </span>
      {props.children}
      {props.hint ? <span class="mt-1 block text-xs text-slate-400">{props.hint}</span> : null}
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
    <select {...rest} value={local.value} class={`${inputClass} ${local.class ?? ''}`}>
      {local.options.map((o) => (
        <option value={o.value} selected={o.value === local.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ColorInput(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <div class={`flex items-center gap-2 ${local.class ?? ''}`}>
      <input
        type="color"
        {...rest}
        class="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 shadow-sm"
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
      class={`flex items-center gap-2 text-sm text-slate-700 ${props.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        class={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          props.checked ? 'bg-sky-600' : 'bg-slate-300'
        }`}
      >
        <span
          class={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
            props.checked ? 'translate-x-4.5' : 'translate-x-1'
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
      class={`inline-flex flex-wrap gap-1 rounded-lg border border-slate-300 bg-slate-100 p-1 ${
        props.disabled ? 'opacity-60' : ''
      }`}
    >
      {props.options.map((o) => (
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.onChange(o.value)}
          class={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            props.disabled ? 'cursor-not-allowed' : ''
          } ${
            props.value === o.value
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}