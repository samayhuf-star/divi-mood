import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type CycleSettings, type DateStr, type MoodLevel, addDays, diffDays } from './engine/cycle';
import type { Flow } from './theme';

// All data lives on the device only. No account, no server, nothing shared.
export type Mode = 'self' | 'partner'; // self = own cycle, partner = someone else's mood forecast from what the user enters

export interface Profile {
  id: string;
  name: string;
  mode: Mode;
  irregular: boolean;
  flows: Record<DateStr, Flow>;
  moods: Record<DateStr, MoodLevel>;
  settings: CycleSettings;
}

interface Data {
  onboarded: boolean;
  disclaimerAccepted: boolean;
  profiles: Profile[];
  activeId: string;
}
const EMPTY: Data = { onboarded: false, disclaimerAccepted: false, profiles: [], activeId: '' };
const KEY = 'wifeymood.v1';

export interface NewPerson {
  name: string;
  mode: Mode;
  lastPeriod: DateStr | null;
  cycleLength: number;
  periodLength: number;
  irregular: boolean;
}

interface Ctx {
  ready: boolean;
  onboarded: boolean;
  profiles: Profile[];
  activeId: string;
  // active profile, flattened so screens stay simple
  name: string;
  mode: Mode;
  irregular: boolean;
  flows: Record<DateStr, Flow>;
  moods: Record<DateStr, MoodLevel>;
  settings: CycleSettings;
  periodStarts: DateStr[];
  setFlow: (d: DateStr, f: Flow | null) => void;
  setMood: (d: DateStr, m: MoodLevel | null) => void;
  setSettings: (s: Partial<CycleSettings>) => void;
  switchProfile: (id: string) => void;
  addProfile: (p: NewPerson) => void;
  removeProfile: (id: string) => void;
  restartProfile: (id: string, p: NewPerson) => void;
  renameProfile: (id: string, name: string) => void;
  finishOnboarding: (p: NewPerson) => void;
  acceptDisclaimer: () => void;
  wipe: () => void;
}
const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

/** A period start = a bleeding day (not spotting) whose previous day has no bleeding logged. */
export function startsFromFlows(flows: Record<DateStr, Flow>): DateStr[] {
  return Object.keys(flows)
    .filter((d) => flows[d] !== 'spotting' && !(flows[addDays(d, -1)] && flows[addDays(d, -1)] !== 'spotting'))
    .sort();
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function makeProfile(p: NewPerson): Profile {
  const flows: Record<DateStr, Flow> = {};
  if (p.lastPeriod) {
    for (let i = 0; i < p.periodLength; i++) flows[addDays(p.lastPeriod, i)] = i < 1 || i > p.periodLength - 2 ? 'light' : 'medium';
  }
  return {
    id: uid(),
    name: p.name.trim() || (p.mode === 'self' ? 'Me' : 'Wifey'),
    mode: p.mode,
    irregular: p.irregular,
    flows,
    moods: {},
    settings: { ...DEFAULT_SETTINGS, cycleLength: p.cycleLength, periodLength: p.periodLength },
  };
}

/** Upgrades data saved by the first single-person version. */
function migrate(raw: any): Data {
  if (raw && Array.isArray(raw.profiles)) return { ...EMPTY, ...raw };
  if (raw && raw.onboarded) {
    const pr: Profile = {
      id: uid(),
      name: raw.mode === 'partner' ? 'Wifey' : 'Me',
      mode: raw.mode ?? 'self',
      irregular: !!raw.irregular,
      flows: raw.flows ?? {},
      moods: raw.moods ?? {},
      settings: raw.settings ?? DEFAULT_SETTINGS,
    };
    return { onboarded: true, disclaimerAccepted: !!raw.disclaimerAccepted, profiles: [pr], activeId: pr.id };
  }
  return EMPTY;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setData(migrate(JSON.parse(raw)));
      } catch {
        /* corrupt or unavailable storage: start fresh rather than crash */
      }
      setReady(true);
    })();
  }, []);

  const update = useCallback((fn: (d: Data) => Data) => {
    setData((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const active = data.profiles.find((p) => p.id === data.activeId) ?? data.profiles[0];
    const patchActive = (fn: (p: Profile) => Profile) =>
      update((d) => {
        const cur = d.profiles.find((x) => x.id === d.activeId) ?? d.profiles[0];
        return { ...d, profiles: d.profiles.map((p) => (p.id === cur?.id ? fn(p) : p)) };
      });
    return {
      ready,
      onboarded: data.onboarded,
      profiles: data.profiles,
      activeId: active?.id ?? '',
      name: active?.name ?? '',
      mode: active?.mode ?? 'self',
      irregular: active?.irregular ?? false,
      flows: active?.flows ?? {},
      moods: active?.moods ?? {},
      settings: active?.settings ?? DEFAULT_SETTINGS,
      periodStarts: startsFromFlows(active?.flows ?? {}),
      setFlow: (d, f) => patchActive((p) => { const flows = { ...p.flows }; if (f) flows[d] = f; else delete flows[d]; return { ...p, flows }; }),
      setMood: (d, m) => patchActive((p) => { const moods = { ...p.moods }; if (m) moods[d] = m; else delete moods[d]; return { ...p, moods }; }),
      setSettings: (s) => patchActive((p) => ({ ...p, settings: { ...p.settings, ...s } })),
      switchProfile: (id) => update((d) => ({ ...d, activeId: id })),
      addProfile: (np) => update((d) => { const pr = makeProfile(np); return { ...d, profiles: [...d.profiles, pr], activeId: pr.id }; }),
      removeProfile: (id) => update((d) => {
        if (d.profiles.length <= 1) return d; // always keep one
        const profiles = d.profiles.filter((p) => p.id !== id);
        return { ...d, profiles, activeId: d.activeId === id ? profiles[0].id : d.activeId };
      }),
      restartProfile: (id, np) => update((d) => ({
        ...d,
        profiles: d.profiles.map((p) => (p.id === id ? { ...makeProfile({ ...np, mode: p.mode }), id: p.id } : p)),
      })),
      renameProfile: (id, name) => update((d) => ({ ...d, profiles: d.profiles.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)) })),
      finishOnboarding: (np) => update((d) => { const pr = makeProfile(np); return { ...d, onboarded: true, profiles: [pr], activeId: pr.id }; }),
      acceptDisclaimer: () => update((d) => ({ ...d, disclaimerAccepted: true })),
      wipe: () => update(() => ({ ...EMPTY })),
    };
  }, [data, ready, update]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export { diffDays };
