import { C } from '../theme';
import { cycleInfoFor, type CycleSettings, type DateStr } from '../engine/cycle';
import type { Flow } from '../theme';

/** Every date gets one of these kinds, so every date has a colour and a legend entry. */
export type Kind = 'period' | 'expected' | 'periodLight' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'pms';

export const KIND_LABEL: Partial<Record<Kind, string>> = {
  period: 'Period', expected: 'Expected', follicular: 'Follicular', fertile: 'Fertile', ovulation: 'Ovulation', luteal: 'Luteal', pms: 'PMS',
};
export const LEGEND_ORDER: Kind[] = ['period', 'expected', 'follicular', 'fertile', 'ovulation', 'luteal', 'pms'];

export const KIND_STYLE: Record<Kind, { bg: string; border?: string; dashed?: boolean; white?: boolean }> = {
  period: { bg: C.period, white: true },
  expected: { bg: '#FFFFFF', border: C.period, dashed: true },
  periodLight: { bg: '#FFDCD2' },
  follicular: { bg: '#FFEFD9' },
  fertile: { bg: C.mint },
  ovulation: { bg: C.mint, border: C.mintDark },
  luteal: { bg: '#FFF6C9' },
  pms: { bg: '#EBE2FF' },
};

export function dayKind(d: DateStr, starts: DateStr[], flows: Record<DateStr, Flow>, settings: CycleSettings, today: DateStr): Kind | null {
  if (flows[d] && flows[d] !== 'spotting') return 'period';
  const info = cycleInfoFor(d, starts, settings);
  if (!info) return null;
  switch (info.phase) {
    case 'period': return !flows[d] && d >= today ? 'expected' : 'periodLight';
    case 'ovulation': return 'ovulation';
    case 'fertile': return 'fertile';
    case 'pms': return 'pms';
    case 'luteal': return 'luteal';
    default: return 'follicular';
  }
}
