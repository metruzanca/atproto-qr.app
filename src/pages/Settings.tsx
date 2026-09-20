import { createEffect, createSignal, For, Show } from 'solid-js';

import { agent, authReady, profile } from '../lib/atproto/auth';
import { authedClient, listQRRecords, putQRRecord, type QRRecordItem } from '../lib/atproto/records';
import {
  globalAnalytics,
  isValidTrackingConfig,
  saveGlobalAnalytics,
  trackingConfigSummary,
  type TrackingConfig,
} from '../lib/qr/tracking';
import {
  globalImageProxyUrl,
  saveGlobalImageProxy,
} from '../lib/qr/imageProxy';
import { defaultProxyOrigin } from '../lib/qr/style';
import { TrackingConfigFields } from '../components/TrackingConfigFields';
import { showToast } from '../components/Toast';
import { Field, TextInput } from '../components/ui';

function trackingState(item: QRRecordItem): 'none' | 'global' | 'custom' {
  const t = item.record.tracking;
  if (!t) return 'none';
  return t.source;
}

export default function Settings() {
  const [config, setConfig] = createSignal<TrackingConfig | undefined>(undefined);
  const [codes, setCodes] = createSignal<QRRecordItem[]>([]);
  const [selected, setSelected] = createSignal<Set<string>>(new Set());
  const [loaded, setLoaded] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [applying, setApplying] = createSignal(false);
  const [error, setError] = createSignal('');
  const [proxyUrl, setProxyUrl] = createSignal<string | undefined>(undefined);
  const [proxyDirty, setProxyDirty] = createSignal(false);
  const [proxySaving, setProxySaving] = createSignal(false);

  createEffect(() => {
    if (!proxyDirty()) setProxyUrl(globalImageProxyUrl());
  });

  const onProxyChange = (url: string) => {
    setProxyDirty(true);
    setProxyUrl(url || undefined);
  };

  const saveProxy = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    const url = proxyUrl();
    if (url && !/^https?:\/\//i.test(url)) {
      setError('Enter a full proxy URL (https://…).');
      return;
    }
    setProxySaving(true);
    setError('');
    try {
      await saveGlobalImageProxy(a, p.did, url);
      setProxyDirty(false);
      showToast('Global image proxy saved');
    } catch (err) {
      console.error(err);
      setError('Could not save. Please try again.');
    } finally {
      setProxySaving(false);
    }
  };

  const removeProxy = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (!confirm('Reset the global image proxy to the default? Codes using the default proxy will use images.weserv.nl.')) return;
    setProxySaving(true);
    setError('');
    try {
      await saveGlobalImageProxy(a, p.did, undefined);
      setProxyUrl(undefined);
      setProxyDirty(false);
      showToast('Global image proxy removed');
    } catch (err) {
      console.error(err);
      setError('Could not remove the global image proxy.');
    } finally {
      setProxySaving(false);
    }
  };

  createEffect(() => {
    if (!dirty()) setConfig(globalAnalytics());
  });

  const onConfigChange = (value: TrackingConfig | undefined) => {
    setDirty(true);
    setConfig(value);
  };

  createEffect(() => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (loaded()) return;
    setLoaded(true);
    void (async () => {
      try {
        const all = await listQRRecords(authedClient(a), p.did);
        setCodes(all.filter((i) => (i.record.kind ?? 'fixed') === 'dynamic'));
      } catch (err) {
        console.error(err);
        setError('Could not load your QR codes.');
      }
    })();
  });

  const toggle = (rkey: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rkey)) {
        next.delete(rkey);
      } else {
        next.add(rkey);
      }
      return next;
    });
  };

  const save = async () => {
    const a = agent();
    const p = profile();
    const c = config();
    if (!a || !p || !c) return;
    if (!isValidTrackingConfig(c)) {
      setError('Fill in the required fields for the selected provider.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveGlobalAnalytics(a, p.did, c);
      showToast('Global analytics saved');
    } catch (err) {
      console.error(err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const a = agent();
    const p = profile();
    if (!a || !p) return;
    if (!confirm('Remove the global analytics config? Codes that use global tracking will stop tracking.')) return;
    setSaving(true);
    setError('');
    try {
      await saveGlobalAnalytics(a, p.did, undefined);
      setConfig(undefined);
      showToast('Global analytics removed');
    } catch (err) {
      console.error(err);
      setError('Could not remove the global analytics config.');
    } finally {
      setSaving(false);
    }
  };

  const apply = async () => {
    const a = agent();
    const p = profile();
    const chosen = [...selected()];
    if (!a || !p || chosen.length === 0) return;
    setApplying(true);
    setError('');
    let ok = 0;
    try {
      for (const rkey of chosen) {
        const item = codes().find((c) => c.rkey === rkey);
        if (!item) continue;
        const record = { ...item.record, tracking: { source: 'global' } as const };
        await putQRRecord(authedClient(a), p.did, rkey, record);
        ok++;
      }
      setCodes(
        codes().map((c) =>
          chosen.includes(c.rkey) ? { ...c, record: { ...c.record, tracking: { source: 'global' } as const } } : c,
        ),
      );
      setSelected(new Set<string>());
      showToast(`Applied global tracking to ${ok} code${ok === 1 ? '' : 's'}`);
    } catch (err) {
      console.error(err);
      setError('Could not apply tracking to all selected codes.');
    } finally {
      setApplying(false);
    }
  };

  const dynamicCount = () => codes().length;

  return (
    <main class="mx-auto max-w-3xl px-4 py-8">
      <Show
        when={authReady()}
        fallback={
          <div class="spinner" />
        }
      >
        <Show
          when={profile()}
          fallback={
            <div class="card p-8 text-center">
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Sign in to manage your settings</h1>
              <a href="/login" class="btn-primary mt-4 inline-block">
                Sign in
              </a>
            </div>
          }
        >
          <div class="mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Stored in your own account on the network.</p>
          </div>

          <Show when={error()}>
            <p class="mb-4 text-sm text-red-600 dark:text-red-400">{error()}</p>
          </Show>

          <section class="card p-5">
            <h2 class="section-label">
              Global analytics
            </h2>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              One tracking setup used by any dynamic code that opts into global tracking. Change it any time — codes
              already using it pick up the change on their next visit.
            </p>

            <div class="mt-4">
              <TrackingConfigFields config={config()} onChange={onConfigChange} />
            </div>

            <Show when={config() && globalAnalytics()}>
              <p class="mt-4 rounded-xl bg-white/50 px-3 py-2 text-xs text-slate-500 backdrop-blur dark:bg-white/[0.03] dark:text-slate-400">
                Currently saved: {trackingConfigSummary(globalAnalytics()!)}
              </p>
            </Show>

            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={save} disabled={saving()} class="btn-primary">
                {saving() ? 'Saving…' : 'Save'}
              </button>
              <Show when={globalAnalytics()}>
                <button type="button" onClick={remove} disabled={saving()} class="btn-danger">
                  Remove
                </button>
              </Show>
            </div>
          </section>

          <section class="card mt-6 p-5">
            <h2 class="section-label">
              Image proxy
            </h2>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              When a logo can't be loaded directly into a QR code, it's routed through an image proxy. Choose the
              default proxy for your codes here — codes that use the default proxy pick up this change automatically.
            </p>

            <div class="mt-4 space-y-2.5">
              <label class="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name="global-proxy"
                  checked={proxyUrl() === undefined}
                  onChange={() => onProxyChange('')}
                  class="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                />
                <span>
                  <span class="font-medium text-slate-900 dark:text-white">Default proxy</span>
                  <span class="block text-xs text-slate-500 dark:text-slate-400">{defaultProxyOrigin()}</span>
                </span>
              </label>
              <label class="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name="global-proxy"
                  checked={proxyUrl() !== undefined}
                  onChange={() => onProxyChange(proxyUrl() ?? '')}
                  class="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                />
                <span class="min-w-0 flex-1">
                  <span class="block font-medium text-slate-900 dark:text-white">Custom proxy</span>
                  <span class="block text-xs text-slate-500 dark:text-slate-400">Enter your own proxy URL</span>
                </span>
              </label>
              <Show when={proxyUrl() !== undefined}>
                <Field label="Proxy URL">
                  <TextInput
                    placeholder="https://your-proxy.example.com"
                    spellcheck={false}
                    value={proxyUrl() ?? ''}
                    onInput={(e) => onProxyChange(e.currentTarget.value)}
                  />
                </Field>
              </Show>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={saveProxy} disabled={proxySaving()} class="btn-primary">
                {proxySaving() ? 'Saving…' : 'Save'}
              </button>
              <Show when={globalImageProxyUrl()}>
                <button type="button" onClick={removeProxy} disabled={proxySaving()} class="btn-danger">
                  Remove
                </button>
              </Show>
            </div>
          </section>

          <Show when={globalAnalytics()}>
            <section class="card mt-6 p-5">
              <h2 class="section-label">
                Apply to existing codes
              </h2>
              <p class="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Opt {dynamicCount()} dynamic code{dynamicCount() === 1 ? '' : 's'} in to global tracking. Codes with
                custom tracking are left alone.
              </p>

              <Show when={dynamicCount() === 0}>
                <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">No dynamic codes yet.</p>
              </Show>

              <Show when={dynamicCount() > 0}>
                <ul class="mt-4 divide-y divide-slate-100 dark:divide-white/[0.06]">
                  <For each={codes()}>
                    {(item) => {
                      const state = trackingState(item);
                      const isCustom = state === 'custom';
                      return (
                        <li class="flex items-center gap-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected().has(item.rkey)}
                            disabled={isCustom}
                            onChange={() => toggle(item.rkey)}
                            class="h-4 w-4 rounded accent-sky-600 disabled:opacity-40"
                          />
                          <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                            {item.rkey}
                          </span>
                          <span
                            class={`badge ${
                              state === 'custom'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : state === 'global'
                                  ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {state === 'custom' ? 'Custom' : state === 'global' ? 'Global' : 'None'}
                          </span>
                        </li>
                      );
                    }}
                  </For>
                </ul>

                <button
                  type="button"
                  onClick={apply}
                  disabled={applying() || selected().size === 0}
                  class="btn-primary mt-4"
                >
                  {applying() ? 'Applying…' : `Apply to ${selected().size} selected`}
                </button>
              </Show>
            </section>
          </Show>
        </Show>
      </Show>
    </main>
  );
}