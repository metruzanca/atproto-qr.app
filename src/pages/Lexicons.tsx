import { A } from '@solidjs/router';
import type { JSX } from 'solid-js';

function CodeBlock(props: { children: JSX.Element }) {
  return (
    <pre class="mt-2 overflow-x-auto rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 font-mono text-xs leading-relaxed text-slate-800 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
      {props.children}
    </pre>
  );
}

function Sub(props: { children: JSX.Element }) {
  return <h3 class="mt-8 text-base font-semibold text-slate-900 dark:text-white">{props.children}</h3>;
}

function P(props: { children: JSX.Element; class?: string }) {
  return (
    <p class={`mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${props.class ?? ''}`}>{props.children}</p>
  );
}

function NSID(props: { nsid: string; href?: string }) {
  const inner = <code class="font-mono text-[13px] font-semibold text-sky-700 dark:text-sky-300">{props.nsid}</code>;
  return props.href ? (
    <a href={props.href} target="_blank" rel="noopener noreferrer" class="hover:underline">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Table(props: { head: string[]; children: JSX.Element }) {
  return (
    <div class="mt-3 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]">
            {props.head.map((h) => (
              <th class="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200/80 bg-white/60 backdrop-blur dark:divide-white/[0.06] dark:bg-white/[0.02]">{props.children}</tbody>
      </table>
    </div>
  );
}

function TR(props: { children: JSX.Element }) {
  return <tr class="text-slate-700 dark:text-slate-200">{props.children}</tr>;
}

function TD(props: { children: JSX.Element }) {
  return <td class="px-4 py-2 align-top text-xs leading-relaxed">{props.children}</td>;
}

const QR_CODE: string = `{
  $type: 'app.atproto-qr.qr',
  kind: 'fixed' | 'dynamic',
  content: { type: ContentType, fields: Record<string, unknown> },
  style: QRStyle,
  qrValue?: string,
  createdAt: string,   // ISO 8601
  updatedAt: string,   // ISO 8601
  aliases?: string[],  // every previous name, oldest first
  tracking?: QRCodeTracking, // dynamic codes only
}`;

const STYLE: string = `{
  size: number,                          // e.g. 512
  shape: 'square' | 'circle',
  dotsType: string,
  dotsColor: string,                     // hex
  cornersSquareType: string | null,
  cornersSquareColor: string | null,
  cornersDotType: string | null,
  cornersDotColor: string | null,
  backgroundColor: string,               // hex
  backgroundMargin: number,
  image: string | null,                  // URL or data:/blob: URI
  imageMargin: number,
  imageSize: number,                     // integer percent, e.g. 40 = 40%
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H',
  imageProxy?: boolean,                  // route the logo through a CORS proxy
  imageProxyUrl?: string,                // per-code proxy origin; absent = "default"
}`;

const TRACKING: string = `type QRCodeTracking =
  | { source: 'global' }                    // reference to the owner's settings record
  | { source: 'custom'; config: TrackingConfig };

type TrackingConfig =
  | { provider: 'ga4'; measurementId: string; apiSecret?: string }
  | { provider: 'plausible'; domain: string; endpoint?: string }
  | { provider: 'umami'; websiteId: string; endpoint: string }
  | { provider: 'matomo'; endpoint: string; siteId: number };`;

const CONTENT_FIELDS: [string, string][] = [
  ['url', '{ url }'],
  ['text', '{ text }'],
  ['email', '{ address, subject, body }'],
  ['phone', '{ phone }'],
  ['sms', '{ phone, message }'],
  ['wifi', '{ ssid, password, encryption, hidden }'],
  ['vcard', '{ name, org, title, phone, email, url }'],
  ['geo', '{ lat, lon }'],
  ['event', '{ title, location, description, start, end }'],
  ['crypto', '{ currency, address, amount }'],
  ['file', '{ name, mimeType, size, blob: BlobRef }'],
];

const REDIRECT: string = `{
  $type: 'app.atproto-qr.redirect',
  target: string,   // the name this redirect points to (a slug, not a URL)
  note: string,     // "DO NOT DELETE — keeps printed QR codes working"
  createdAt: string,
}`;

const SETTINGS: string = `{
  $type: 'app.atproto-qr.settings',   // always written at rkey "preferences"
  theme: 'light' | 'dark' | 'system',
  analytics?: TrackingConfig,         // the global analytics config
  imageProxy?: string,                // global default image-proxy origin
  updatedAt: string,
}`;

export default function Lexicons() {
  return (
    <main class="mx-auto max-w-3xl px-4 py-12">
      <section>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Lexicon reference</h1>
        <P>
          Every piece of data this app reads or writes is an atproto{' '}
          <a
            href="https://atproto.com/specs/lexicon"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sky-700 underline hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            lexicon
          </a>{' '}
          — either a record stored in your PDS or an XRPC method call. Three of them are lexicons this app defines (
          <code class="font-mono">app.atproto-qr.*</code>); the rest are standard atproto and Bluesky lexicons. The
          app-defined records have no published JSON schema, so the exact shapes live here.
        </P>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Records this app defines</h2>
        <P>
          All three are written to your PDS under your own handle. They use the{' '}
          <code class="font-mono">app.atproto-qr.*</code> namespace; anything else holding that namespace would be
          impersonation.
        </P>

        <Sub>
          <NSID nsid="app.atproto-qr.qr" />
          <span class="ml-1 font-normal text-slate-500 dark:text-slate-400">— a saved QR code</span>
        </Sub>
        <P>
          Created when you save a code. The record key (rkey) is your chosen name — a slug of lowercase letters,
          digits, and hyphens, ≤63 characters. Fixed codes encode their data directly; dynamic codes encode the app
          URL <code class="font-mono">{'{origin}/{handle}/{name}'}</code>, snapshotted into <code class="font-mono">qrValue</code>.
        </P>
        <CodeBlock>{QR_CODE}</CodeBlock>
        <P>
          <code class="font-mono">kind</code> is <code class="font-mono">fixed</code> or <code class="font-mono">dynamic</code>; legacy
          records without it are treated as fixed. <code class="font-mono">aliases</code> tracks every name this code
          has ever had (oldest first) so delete can cascade to the old redirect records.
        </P>

        <h4 class="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-100">content</h4>
        <P>
          The payload the code is for. <code class="font-mono">type</code> is one of 11 content types;{' '}
          <code class="font-mono">fields</code> holds that type's fields:
        </P>
        <Table head={['type', 'fields']}>
          {CONTENT_FIELDS.map(([type, fields]) => (
            <TR>
              <TD>
                <code class="font-mono text-sky-700 dark:text-sky-300">{type}</code>
              </TD>
              <TD>
                <code class="font-mono">{fields}</code>
              </TD>
            </TR>
          ))}
        </Table>
        <P>
          The <code class="font-mono">file</code> type stores an atproto{' '}
          <code class="font-mono">BlobRef</code> — <code class="font-mono">{'{ $type: "blob", ref: { $link }, mimeType, size }'}</code> —
          uploaded to your PDS with <code class="font-mono">com.atproto.repo.uploadBlob</code>. Its QR payload (a{' '}
          <code class="font-mono">com.atproto.sync.getBlob</code> URL) is recomputed at render, never stored.
        </P>

        <h4 class="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-100">style</h4>
        <P>Serializable styling options, mapped to qr-code-styling at render time:</P>
        <CodeBlock>{STYLE}</CodeBlock>
        <P>
          The PDS rejects float values in records, so <code class="font-mono">imageSize</code> is stored as an integer
          percent (40 = 40%) and converted to a 0–1 coefficient when rendering.
        </P>

        <h4 class="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-100">tracking</h4>
        <P>
          Dynamic codes only — never set for fixed codes. <code class="font-mono">global</code> is a reference to the
          owner's settings record, resolved at render time so global edits apply retroactively;{' '}
          <code class="font-mono">custom</code> carries its own config. Beacons fire client-side from the public page.
        </P>
        <CodeBlock>{TRACKING}</CodeBlock>

        <Sub>
          <NSID nsid="app.atproto-qr.redirect" />
          <span class="ml-1 font-normal text-slate-500 dark:text-slate-400">— old-name redirect</span>
        </Sub>
        <P>
          Written at the old name when a code is renamed, so printed URLs keep scanning to the right place. Public
          pages follow redirect hops client-side. The <code class="font-mono">note</code> is a visible warning for
          anyone browsing their PDS.
        </P>
        <CodeBlock>{REDIRECT}</CodeBlock>

        <Sub>
          <NSID nsid="app.atproto-qr.settings" />
          <span class="ml-1 font-normal text-slate-500 dark:text-slate-400">— user preferences</span>
        </Sub>
        <P>
          A single record at rkey <code class="font-mono">preferences</code> holding the theme, the global analytics
          config, and the global default image-proxy origin. Three modules (theme, analytics, image proxy) read and
          write it; each write is a read-modify-write so one never clobbers another.
        </P>
        <CodeBlock>{SETTINGS}</CodeBlock>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Standard atproto lexicons</h2>
        <P>
          Record CRUD against your PDS, plus blob upload. Docs at{' '}
          <a
            href="https://atproto.com/lexicons/com-atproto-repo-getRecord"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sky-700 underline hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            atproto.com/lexicons
          </a>
          .
        </P>
        <Table head={['lexicon', 'method', 'used for']}>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.createRecord" href="https://atproto.com/lexicons/com-atproto-repo-createRecord" />
            </TD>
            <TD>POST</TD>
            <TD>Save a code; atomic name-uniqueness (fails with "already exists" when the name is taken).</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.putRecord" href="https://atproto.com/lexicons/com-atproto-repo-putRecord" />
            </TD>
            <TD>POST</TD>
            <TD>Update a code, and write redirect records and the settings record.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.getRecord" href="https://atproto.com/lexicons/com-atproto-repo-getRecord" />
            </TD>
            <TD>GET</TD>
            <TD>Public reads of codes, redirects, and settings straight from the owner's PDS.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.listRecords" href="https://atproto.com/lexicons/com-atproto-repo-listRecords" />
            </TD>
            <TD>GET</TD>
            <TD>List your codes, and gather QR + redirect keys for name-uniqueness checks.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.deleteRecord" href="https://atproto.com/lexicons/com-atproto-repo-deleteRecord" />
            </TD>
            <TD>POST</TD>
            <TD>Cascade delete: the QR record plus every alias redirect.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.repo.uploadBlob" href="https://atproto.com/lexicons/com-atproto-repo-uploadBlob" />
            </TD>
            <TD>POST</TD>
            <TD>Upload the file backing a <code class="font-mono">file</code> content type (up to 5 MB).</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.sync.getBlob" href="https://atproto.com/lexicons/com-atproto-sync-getBlob" />
            </TD>
            <TD>GET</TD>
            <TD>The URL encoded by <code class="font-mono">file</code> codes — points at the blob on your PDS.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="com.atproto.identity.resolveHandle" href="https://atproto.com/lexicons/com-atproto-identity-resolveHandle" />
            </TD>
            <TD>GET</TD>
            <TD>Handle → DID, called internally by atcute's handle resolver when resolving <code class="font-mono">/handle/name</code> URLs.</TD>
          </TR>
        </Table>
      </section>

      <section class="mt-12">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Bluesky lexicons</h2>
        <P>
          Queried against the public AppView ({' '}
          <code class="font-mono">https://public.api.bsky.app</code>). Docs at{' '}
          <a
            href="https://docs.bsky.app/lexicons/app-bsky-actor-getProfile"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sky-700 underline hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            docs.bsky.app
          </a>
          .
        </P>
        <Table head={['lexicon', 'method', 'used for']}>
          <TR>
            <TD>
              <NSID nsid="app.bsky.actor.getProfile" href="https://docs.bsky.app/lexicons/app-bsky-actor-getProfile" />
            </TD>
            <TD>GET</TD>
            <TD>Avatar and display name for the signed-in header.</TD>
          </TR>
          <TR>
            <TD>
              <NSID nsid="app.bsky.actor.searchActorsTypeahead" href="https://docs.bsky.app/lexicons/app-bsky-actor-searchActorsTypeahead" />
            </TD>
            <TD>GET</TD>
            <TD>Handle typeahead suggestions on the sign-in page.</TD>
          </TR>
        </Table>
      </section>

      <section class="card mt-12 p-6">
        <P>
          Every record above is public and queryable from your PDS at any time — that's the trade that keeps this
          free. You can browse them with a tool like{' '}
          <a
            href="https://pdsls.dev/at://metru.dev/app.atproto-qr.qr"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-sky-700 underline hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            pdsls.dev
          </a>
          .
        </P>
        <P class="mt-3">
          <A href="/about" class="inline-block text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
            ← Back to About
          </A>
        </P>
      </section>
    </main>
  );
}