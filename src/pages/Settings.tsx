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
import { TrackingConfigFields } from '../components/TrackingConfigFields';
import { showToast } from '../components/Toast';

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
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-500" />
        }
      >
        <Show
          when={profile()}
          fallback={
            <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Sign in to manage your settings</h1>
              <a href="/login" class="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                Sign in
              </a>
            </div>
          }
        >
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">Stored in your own account on the network.</p>
          </div>

          <Show when={error()}>
            <p class="mb-4 text-sm text-red-600 dark:text-red-400">{error()}</p>
          </Show>

          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Global analytics
            </h2>
            <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              One tracking setup used by any dynamic code that opts into global tracking. Change it any time — codes
              already using it pick up the change on their next visit.
            </p>

            <div class="mt-4">
              <TrackingConfigFields config={config()} onChange={onConfigChange} />
            </div>

            <Show when={config() && globalAnalytics()}>
              <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Currently saved: {trackingConfigSummary(globalAnalytics()!)}
              </p>
            </Show>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving()}
                class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
              >
                {saving() ? 'Saving…' : 'Save'}
              </button>
              <Show when={globalAnalytics()}>
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving()}
                  class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Remove
                </button>
              </Show>
            </div>
          </section>

          <Show when={globalAnalytics()}>
            <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Apply to existing codes
              </h2>
              <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Opt {dynamicCount()} dynamic code{dynamicCount() === 1 ? '' : 's'} in to global tracking. Codes with
                custom tracking are left alone.
              </p>

              <Show when={dynamicCount() === 0}>
                <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">No dynamic codes yet.</p>
              </Show>

              <Show when={dynamicCount() > 0}>
                <ul class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
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
                            class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"
                          />
                          <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                            {item.rkey}
                          </span>
                          <span
                            class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              state === 'custom'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                : state === 'global'
                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
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
                  class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
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