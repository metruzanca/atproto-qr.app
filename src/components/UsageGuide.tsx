import type { JSX } from 'solid-js';

import type { ContentType } from '../lib/qr/content';

const iconClass = 'h-5 w-5';

interface ExampleCard {
  type: ContentType;
  label: string;
  icon: JSX.Element;
  title: string;
  desc: string;
  tip: string;
}

const EXAMPLES: ExampleCard[] = [
  {
    type: 'url',
    label: 'URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: 'Point people at a webpage',
    desc: 'Menus, current offers, review pages, booking links — anything on the internet, in one scan.',
    tip: 'Expect to change the destination later? Save it as a Dynamic code so the printed sticker never goes stale.',
  },
  {
    type: 'wifi',
    label: 'WiFi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
    title: 'Guest WiFi, no typing',
    desc: 'Cafés, Airbnbs, offices, waiting rooms. Guests connect in one scan — no password typing or spelling mistakes.',
    tip: 'WiFi details are baked into a Fixed code. Change the password and you reprint.',
  },
  {
    type: 'vcard',
    label: 'vCard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
    title: 'Your contact card in a tap',
    desc: 'Business cards, networking, freelancers and artists. One scan saves your full details to a phone.',
    tip: 'Keep the fields short — a lean vCard makes a cleaner, easier-to-scan code.',
  },
  {
    type: 'email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 5L2 7" />
      </svg>
    ),
    title: 'Email in one tap',
    desc: 'Support, feedback, newsletter sign-ups. You can even pre-fill a subject line and body.',
    tip: 'Good for print materials where a contact form would be overkill.',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: 'Call now',
    desc: 'Storefronts, property signs, tradespeople — anywhere a phone call is the next step.',
    tip: 'Include the country code so international callers reach you too.',
  },
  {
    type: 'sms',
    label: 'SMS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Text to order or get info',
    desc: 'SMS ordering, quick replies, short promos. The scan opens the message with your text already written.',
    tip: 'Pre-fill a message so people just hit send.',
  },
  {
    type: 'geo',
    label: 'Geo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'An exact spot, no addresses',
    desc: 'Venues, parking, meeting points, store entrances. Drop a pin instead of a street address.',
    tip: 'Use your phone map to grab precise coordinates, then paste them in.',
  },
  {
    type: 'event',
    label: 'Event',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Straight into a calendar',
    desc: 'Workshops, classes, meetups, appointments. The scan opens the event in the phone’s calendar app with all the details.',
    tip: 'Set a start and end time so the invite lands correctly.',
  },
  {
    type: 'text',
    label: 'Text',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Plain text that works offline',
    desc: 'Instructions, notes, serial numbers. The words live in the code itself — nothing to sign in to, nothing to load.',
    tip: 'Perfect for things that must work even if a website or server disappears.',
  },
  {
    type: 'crypto',
    label: 'Crypto',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01" />
        <path d="M18 12h.01" />
      </svg>
    ),
    title: 'Receive payments or donations',
    desc: 'A wallet address in one scan — no copying a long string by hand, no typos.',
    tip: 'Saved codes are public on the atproto network. Only share addresses you’re happy to be public.',
  },
  {
    type: 'file',
    label: 'File',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: 'Share a file from your own server',
    desc: 'PDFs, menus, product sheets. The code fetches the file straight from your Bluesky account.',
    tip: 'Sign in to upload — the file is stored on your Bluesky account, so it keeps working as long as your account does.',
  },
];

const tips: { title: string; body: string }[] = [
  {
    title: 'Size for the distance',
    body: 'As a rough guide, make the printed code about one-tenth of the scanning distance — roughly 10 cm across for a code scanned from a metre away, and far bigger for posters.',
  },
  {
    title: 'Keep contrast high',
    body: 'Dark code on a light background scans best. Avoid light-on-dark and low-contrast colour combinations.',
  },
  {
    title: 'Leave a quiet zone',
    body: 'Give the code clear breathing room. No text, logos, or graphics crowding its edges.',
  },
  {
    title: 'Test before you print',
    body: 'Scan from the real-world distance with two or three different phone cameras first.',
  },
  {
    title: 'SVG for print, PNG for screens',
    body: 'Vector SVG scales to any print size without blur. PNG is plenty for screens and social posts.',
  },
  {
    title: 'Less data, easier scan',
    body: 'A long vCard or URL makes a denser, harder-to-read code. Trim whatever you can.',
  },
  {
    title: 'Flat and glare-free',
    body: 'Stick to flat, dry surfaces. Curved packaging and glossy finishes break scans.',
  },
];

export function UsageGuide() {
  return (
    <div class="mt-16 space-y-16">
      <section>
        <div class="max-w-2xl">
          <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ideas for your next code</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Every content type is a ready-made use case. Pick one below to start, or read through the ideas — most
            people don’t need all of them, just the one that matches their situation.
          </p>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((card) => (
            <div class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
              <div class="flex items-center justify-between">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {card.icon}
                </span>
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {card.label}
                </span>
              </div>
              <h3 class="mt-3 text-sm font-bold text-slate-900 dark:text-white">{card.title}</h3>
              <p class="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{card.desc}</p>
              <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <span class="font-semibold text-slate-700 dark:text-slate-200">Tip:</span> {card.tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fixed or Dynamic? How to choose</h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          A printed code does one of two things: the information is baked into the square, or the square holds a page
          you can point somewhere new later.
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Fixed — data baked in</h3>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The link, WiFi details, or contact info live inside the code itself. Print it once and it works forever —
              no account, no app, no server in between.
            </p>
            <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span class="font-semibold text-slate-700 dark:text-slate-200">Best for:</span> WiFi, contact cards, and permanent info that
              will never change.
            </p>
            <p class="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span class="font-semibold text-slate-700 dark:text-slate-200">Note:</span> after saving, the data is locked. You can restyle
              it freely, but changing what it points to produces a new image.
            </p>
          </div>

          <div class="rounded-xl border border-violet-200 bg-violet-50/50 p-6 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={iconClass}>
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Dynamic — change it after printing</h3>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The code points at a page you control. Update the destination any time — the printed code never changes,
              and it always shows your latest info.
            </p>
            <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span class="font-semibold text-slate-700 dark:text-slate-200">Best for:</span> menus, offers, and events you’ll repoint.
            </p>
            <p class="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span class="font-semibold text-slate-700 dark:text-slate-200">Note:</span> needs a sign-in — your codes live on your own
              Bluesky account. The code’s page depends on this app and your account staying online.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Print and placement tips</h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          A well-designed code is only half the job. These rules of thumb keep yours scannable out in the real world.
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          {tips.map((tip) => (
            <div class="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
              <span class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{tip.title}</h3>
                <p class="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}