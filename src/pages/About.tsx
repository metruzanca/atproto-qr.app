import { Show, type JSX } from 'solid-js';
import { A } from '@solidjs/router';

import { agent, profile } from '../lib/atproto/auth';

function Disclosure(props: { summary: string; children: JSX.Element }) {
  return (
    <details class="group rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800">
        {props.summary}
        <svg
          viewBox="0 0 20 20"
          class="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180 dark:text-slate-500"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      </summary>
      <div class="border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">{props.children}</div>
    </details>
  );
}

export default function About() {
  const pdsUrl = () => agent()?.session.info.aud ?? null;

  return (
    <main class="mx-auto max-w-3xl px-4 py-12">
      <section class="text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Private by design. Everything runs in your browser.
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          This site has no backend server — no database, no accounts, no logs. Every line of code runs on{' '}
          <span class="font-semibold text-slate-800 dark:text-slate-100">your</span> device. There is nothing here that could know what you
          make, store, or visit.
        </p>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Everything happens on your device</h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          When you open this site, your browser downloads the app and runs it locally. Designing a code, rendering the
          QR image, downloading it — it's all done by your own computer, in real time, with no one else in the loop.
        </p>
        <div class="mt-4 space-y-3">
          <Disclosure summary="Is the QR code really generated locally?">
            <p>
              Yes. The QR code is drawn directly in your browser from the data you enter. This site is just static
              files that run on your device, so nothing you type or design is uploaded, encoded by a remote service, or
              stored along the way. The finished image is produced on your computer and only leaves it if you download
              or share it yourself. That's also why there's nothing here to log, mine, or sell — no server of ours
              exists.
            </p>
          </Disclosure>
          <Disclosure summary={'Then why is there a "sign in" button?'}>
            <p>
              Signing in is the one feature that involves someone else's computer — and even then, not ours. It exists
              only so you can save <span class="font-semibold text-slate-700 dark:text-slate-200">editable</span> QR codes to your own
              atproto personal data server (PDS). The rest of the app works completely without it.
            </p>
          </Disclosure>
        </div>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Why sign in with your Bluesky account?</h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Instead of creating a new account on yet another website, this app uses atproto — the open protocol behind
          Bluesky — so that <span class="font-semibold text-slate-800 dark:text-slate-100">your data lives with you</span>, not with us.
        </p>

        <Show
          when={profile()}
          fallback={
            <div class="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-600 dark:bg-slate-900">
              <p class="text-sm text-slate-600 dark:text-slate-300">
                Sign in to see exactly which server would hold your codes.
              </p>
              <A
                href="/login"
                class="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Sign in
              </A>
            </div>
          }
        >
          {(p) => (
            <div class="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
              <p class="text-sm font-medium text-sky-900 dark:text-sky-100">
                You're signed in as <span class="font-semibold">{p().handle}</span>.
              </p>
              <p class="mt-1 text-sm text-sky-900 dark:text-sky-100">Your QR codes are stored on your personal data server:</p>
              <p class="mt-2 break-all rounded-lg border border-sky-100 bg-white px-3 py-2 font-mono text-sm text-slate-800 dark:border-sky-500/30 dark:bg-slate-800 dark:text-slate-200">
                {pdsUrl()}
              </p>
              <p class="mt-2 text-xs text-sky-700 dark:text-sky-300">
                That's the only server involved. This site never sees your codes — your browser writes them directly to
                your PDS, and reads them straight back when someone opens a code's page.
              </p>
            </div>
          )}
        </Show>

        <div class="mt-4 space-y-3">
          <Disclosure summary="Why atproto, and why Bluesky login?">
            <p>
              atproto was chosen because it treats your data as <em>yours</em>. You already have an identity and a
              home for your data if you use Bluesky — so there's no new account to create and no new silo to join.
              Signing in just authorizes this app to read and write QR code records on <em>your</em> server, under your
              own identity. It's the same protocol Bluesky itself is built on, which means it's open, well-tested, and
              not owned by any single company.
            </p>
          </Disclosure>
          <Disclosure summary="Where do my saved codes live?">
            <p>
              Each saved code is a small record in your <span class="font-semibold text-slate-700 dark:text-slate-200">personal data
              server (PDS)</span> — the server your atproto account belongs to. That might be Bluesky's infrastructure,
              a host you chose, or a server you run yourself. The record is just data: the code's content and its
              styling. There's no copy on this site, because this site has nowhere to store one.
            </p>
          </Disclosure>
          <Disclosure summary="Can you actually see my codes?">
            <p>
              No — and not because we promise not to look, but because there's nothing to look at. This site has no
              backend, no database, and no analytics. When you save a code, your browser talks to your PDS directly.
              Neither the traffic nor the content ever passes through a server we control.
            </p>
            <p class="mt-2">
              One honest caveat: "no analytics" is literal — this site has no tracking of any kind. But atproto itself
              is a public network. The moment you save a code, its record is broadcast to relays and the public
              firehose, and anyone can query the network for every record of type{' '}
              <span class="font-mono">app.atproto-qr.qr</span> — content, styling, and all. That's how the protocol
              works, not a choice we made, and it's the flip side of data you can take anywhere.
            </p>
          </Disclosure>
          <Disclosure summary="So the only server involved is mine?">
            <p>
              Correct. This app itself runs entirely in your browser. The only server that ever gets involved is your
              own PDS, and only for the signed-in features: saving a code, listing your codes, editing, and deleting.
              We don't host one byte of your data.
            </p>
          </Disclosure>
        </div>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Frequently asked questions</h2>
        <div class="mt-4 space-y-3">
          <Disclosure summary="What happens to my codes if this website goes down?">
            <p>
              Your records would be safe, but the friendly links would not. The data itself lives on your PDS, not
              here — it's never lost, and because atproto is portable it can be read back with any client or a re-hosted
              copy of this app. However, a link like{' '}
              <span class="font-mono">{import.meta.env.VITE_PUBLIC_ORIGIN}/you/name</span> only works while someone is serving this app at
              that address. If this site disappeared, those exact URLs would stop resolving even though your codes
              remain intact and fully portable.
            </p>
          </Disclosure>
          <Disclosure summary="Can I host my own copy?">
            <p>
              Yes — and you're encouraged to if it gives you peace of mind. I don't plan to shut this down any time
              soon, but the whole app is static files you can deploy anywhere for free (Vercel, Netlify, Cloudflare
              Pages, and so on). No custom domain is needed, and you can sign in with your own Bluesky handle — e.g.{' '}
              <span class="font-mono">@cmgriffing.bsky.social</span>. The app derives its OAuth client ID and redirect
              URL from a single environment variable (<span class="font-mono">VITE_PUBLIC_ORIGIN</span>), so a
              self-hosted copy works on its own URL out of the box.
            </p>
          </Disclosure>
          <Disclosure summary="What is a PDS?">
            <p>
              A <span class="font-semibold text-slate-700 dark:text-slate-200">Personal Data Server</span> is the server that holds your
              atproto account's data. You get to choose it: it could be run by your provider, a third party you trust,
              or yourself. Because atproto is an open protocol, your data is portable — you can switch servers without
              losing your stuff. That's what makes "owning" your data real rather than a slogan.
            </p>
          </Disclosure>
          <Disclosure summary="How do shared, editable codes work?">
            <p>
              Every saved code has a link. When someone opens it, their browser fetches the record straight from your
              PDS and renders it — again, no middleman. If you edit the code later, the same link simply shows the
              updated version, because the reader always loads the current record from your server.
            </p>
          </Disclosure>
          <Disclosure summary="What's the difference between fixed and dynamic codes?">
            <p>
              A <span class="font-semibold text-slate-700 dark:text-slate-200">fixed</span> code encodes your data directly in the QR
              image, just like any other QR generator. Saving it just stores a copy on your PDS for convenience. The
              data stays locked afterwards so the printed image keeps matching what you made — you can restyle the
              appearance freely, but changing the data produces a new image, so it's gated behind a confirmation.
            </p>
            <p class="mt-2">
              A <span class="font-semibold text-slate-700 dark:text-slate-200">dynamic</span> code encodes a link back to this app instead
              (e.g. <span class="font-mono">https://atproto-qr.app/you/your-code</span>). When someone scans it, they
              land on the code's page, which reads the record from your PDS and shows the current data. You can change
              the data anytime — the printed QR never changes, because the image always points at the same page.
            </p>
          </Disclosure>
          <Disclosure summary="Can I put a file in a QR code?">
            <p>
              Yes — the <span class="font-semibold text-slate-700 dark:text-slate-200">file</span> content type lets you attach a single
              file (up to 25 MB). The file is uploaded as an atproto blob to your own PDS, and the QR encodes a link
              straight to that blob, so scanning it downloads the file. As with everything here, the bytes live on
              your server — this site never touches them.
            </p>
          </Disclosure>
          <Disclosure summary="What if my PDS is unreachable?">
            <p>
              A code's page can't load while your PDS is down — just like any site that's temporarily offline. The
              upside is that you're not stuck: because your data is portable, you can move to another PDS and the same
              links keep working, which isn't possible when a platform owns your data.
            </p>
          </Disclosure>
          <Disclosure summary="What happens if I delete my Bluesky account?">
            <p>
              Your codes live on that account's PDS, so deleting the account removes the records along with it. If a
              code matters to you, keep a note of what it points to before you delete — and remember that with atproto
              you can always move your data to a server you control instead.
            </p>
          </Disclosure>
          <Disclosure summary="What happens to my URL when I rename a code?">
            <p>
              Renaming a code keeps the old link working. When you rename, we write a small
              <span class="font-semibold text-slate-700 dark:text-slate-200"> redirect record</span> at the old name that points to the new
              one, so anything already printed keeps scanning to the right place. The redirect record carries a visible
              note — "DO NOT DELETE — this record keeps previously printed QR codes working" — for anyone poking around
              their PDS in tools like pdsls. Each code's latest record also keeps a list of every name it has ever had.
              When you delete a code, all of those old redirect records are deleted too, in a single atomic write.
            </p>
          </Disclosure>
        </div>
      </section>
    </main>
  );
}
