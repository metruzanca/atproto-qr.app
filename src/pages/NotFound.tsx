import { A, useLocation } from '@solidjs/router';

import { PERSONAL_MODE } from '../lib/personal';

export default function NotFound() {
  const location = useLocation();

  return (
    <main class="mx-auto max-w-2xl px-4 py-16">
      <div class="card p-10 text-center">
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Page not found</h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          There's nothing at <span class="font-mono break-all">{location.pathname}</span>.
        </p>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {PERSONAL_MODE
            ? 'This instance only serves codes from its short links — try the link printed on your QR code.'
            : 'That link may have been mistyped, or the page may have moved.'}
        </p>
        <A href="/" class="btn-primary mt-4 inline-block">
          Go to the studio
        </A>
      </div>
    </main>
  );
}
