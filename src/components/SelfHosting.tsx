import { createMemo, type JSX } from 'solid-js';

import { profile } from '../lib/atproto/auth';
import { APP_HOST, APP_ORIGIN } from '../lib/appOrigin';
import { qrModulesForBytes } from '../lib/qr/size';
import { Reveal } from './Reveal';
import { Eyebrow } from './ui';

const iconClass = 'h-4 w-4';

/** A representative code: a handle that is also the owner's own domain. */
const EXAMPLE_HANDLE = 'example.com';
const EXAMPLE_NAME = 'happy-otter';

interface LinkStats {
  domain: string;
  hosted: string;
  own: string;
  chars: number;
  pxBefore: number;
  pxAfter: number;
  printPercent: number;
  personal: boolean;
}

const PX_PER_MODULE = 10;

function linkStats(handle: string, name = EXAMPLE_NAME, personal = false): LinkStats {
  const hosted = `${APP_ORIGIN}/${handle}/${name}`;
  const own = `https://qr.${handle}#${name}`;
  const pxBefore = qrModulesForBytes(hosted.length) * PX_PER_MODULE;
  const pxAfter = qrModulesForBytes(own.length) * PX_PER_MODULE;
  return {
    domain: handle,
    hosted,
    own,
    chars: hosted.length - own.length,
    pxBefore,
    pxAfter,
    printPercent: Math.round((1 - pxAfter / pxBefore) * 100),
    personal,
  };
}

/** Handles off the default `bsky.social` server are almost always a domain people own. */
function guessedDomain(): string | null {
  const handle = profile()?.handle;
  if (!handle || !handle.includes('.') || /\.bsky\.social$/i.test(handle)) return null;
  return handle;
}

const POINTS = [
  {
    title: 'Nothing to depend on',
    body: 'If this site vanished, your printed codes would still resolve.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Nothing to migrate',
    body: 'Same records, same account. No export or import.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M21 12a9 9 0 1 1-3.5-7.1" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
    ),
  },
  {
    title: 'Shorter links',
    body: 'Your handle leaves the URL, which makes the code smaller.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M4 14h6v6" />
        <path d="M20 10h-6V4" />
        <path d="m14 10 7-7" />
        <path d="m3 21 7-7" />
      </svg>
    ),
  },
];

const STEPS: { title: string; body: JSX.Element }[] = [
  {
    title: 'Deploy the static build',
    body: 'Vercel, Netlify and Cloudflare Pages build Vite apps on their free plans. Any static host works.',
  },
  {
    title: 'Set two variables',
    body: (
      <>
        <span class="font-mono">VITE_DOMAIN</span> is your URL.{' '}
        <span class="font-mono">VITE_OWNER_HANDLE</span> is your handle, and it turns on the short links.
      </>
    ),
  },
  {
    title: 'Sign in once',
    body: 'Same sign-in, same records. New codes encode the short link.',
  },
];

export function SelfHosting() {
  // Personalise the numbers when the signed-in handle looks like a domain they own.
  const stats = createMemo(() => {
    const domain = guessedDomain();
    return domain ? linkStats(domain, EXAMPLE_NAME, true) : linkStats(EXAMPLE_HANDLE);
  });

  return (
    <div class="mt-24">
      <section id="self-hosting" class="hairline scroll-mt-20 pt-14">
        <Reveal>
          <Eyebrow label="True ownership" />
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Put the codes on your own domain
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Your codes are records in your own account, so the data is already yours. The one shared piece is this
            website, the page a scan opens. Run your own copy and that belongs to you too.
          </p>
        </Reveal>

        <div class="mt-8 grid gap-4 lg:grid-cols-2">
          <Reveal class="h-full">
            <div class="card flex h-full flex-col p-6">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">What you get</h3>

              <ul class="mt-4 space-y-4">
                {POINTS.map((point) => (
                  <li class="flex gap-3">
                    <span class="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/15 to-blue-600/15 text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400 dark:ring-sky-400/20">
                      {point.icon}
                    </span>
                    <div>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{point.title}</p>
                      <p class="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{point.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p class="mt-auto pt-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                MIT licensed. No backend, database or logs.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} class="h-full">
            <div class="card flex h-full flex-col p-6">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Same code, shorter link</h3>
              <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The link lives inside the code, so fewer characters means a smaller grid.
              </p>

              <dl class="mt-4 grid grid-cols-2 gap-2">
                <Stat value={`−${stats().chars}`} label="characters" />
                <Stat value={`−${stats().printPercent}%`} label="smaller print" />
              </dl>

              <div class="mt-4 space-y-1.5 rounded-xl border border-slate-200/70 bg-white/50 p-3 font-mono text-[11px] leading-snug backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
                <p class="break-all text-slate-500 dark:text-slate-400">{stats().hosted}</p>
                <p class="break-all text-sky-700 dark:text-sky-400">{stats().own}</p>
              </div>

              <p class="mt-auto pt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {stats().personal
                  ? 'Your handle is a domain you control, so these are your numbers.'
                  : `Shown for a code on ${EXAMPLE_HANDLE}.`}{' '}
                <span class="font-mono">{APP_HOST}</span> and your handle are gone. Only{' '}
                <span class="font-mono">qr.</span> comes back. At {PX_PER_MODULE}px per module, {stats().pxBefore}px
                becomes {stats().pxAfter}px.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div class="card mt-4 p-6">
            <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Getting it running</h3>
                <ol class="mt-4 space-y-3">
                  {STEPS.map((step, i) => (
                    <li class="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                        {i + 1}
                      </span>
                      <span>
                        <span class="font-semibold text-slate-900 dark:text-white">{step.title}.</span> {step.body}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div class="flex min-w-0 flex-col">
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Build-time variables
                </p>
                <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-900/95 p-4 font-mono text-[11px] leading-relaxed text-slate-100 dark:bg-black/40">
                  <code>{`VITE_DOMAIN=https://qr.example.com\nVITE_OWNER_HANDLE=example.com`}</code>
                </pre>
                <div class="mt-auto flex flex-wrap gap-2 pt-4">
                  <a
                    href="https://github.com/metruzanca/atproto-qr.app/tree/main/selfhost"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-primary py-2"
                  >
                    Self-hosting guide
                  </a>
                  <a
                    href="https://github.com/metruzanca/atproto-qr.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-secondary"
                  >
                    Source
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Stat(props: { value: string; label: string }) {
  return (
    <div class="rounded-xl border border-slate-200/70 bg-white/50 px-2 py-2.5 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
      <dt class="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{props.value}</dt>
      <dd class="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-400 dark:text-slate-500">
        {props.label}
      </dd>
    </div>
  );
}
