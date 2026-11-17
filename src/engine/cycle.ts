// Pure cycle / phase / pregnancy-risk logic. No React, no storage, fully unit-tested.
// Dates are handled as local "YYYY-MM-DD" strings to avoid timezone/DST bugs.

export type DateStr = string;

export type Phase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'pms';
export type RiskLevel = 0 | 1 | 2 | 3 | 4; // Very low .. Very high

export interface CycleSettings {
  cycleLength: number; // default average cycle length
  periodLength: number; // default bleeding days
  lutealLength: number; // days from ovulation to next period
}

export const DEFAULT_SETTINGS: CycleSettings = { cycleLength: 28, periodLength: 5, lutealLength: 14 };

export const RISK_LABELS = ['Very low', 'Low', 'Medium', 'High', 'Very high'] as const;

// ---------- date helpers ----------
export function parse(d: DateStr): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day, 12, 0, 0); // noon avoids DST edge cases
}
export function fmt(date: Date): DateStr {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function addDays(d: DateStr, n: number): DateStr {
  const x = parse(d);
  x.setDate(x.getDate() + n);
  return fmt(x);
}
export function diffDays(a: DateStr, b: DateStr): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000);
}
export function todayStr(): DateStr {
  return fmt(new Date());
}

// ---------- cycle statistics ----------
/** Sorted, de-duplicated period start dates; starts closer than 10 days are treated as the same period. */
export function cleanStarts(starts: DateStr[]): DateStr[] {
  const sorted = [...new Set(starts)].sort();
  const out: DateStr[] = [];
  for (const s of sorted) {
    if (out.length === 0 || diffDays(s, out[out.length - 1]) >= 10) out.push(s);
  }
  return out;
}

export function cycleLengths(starts: DateStr[]): number[] {
  const s = cleanStarts(starts);
  const lens: number[] = [];
  for (let i = 1; i < s.length; i++) {
    const l = diffDays(s[i], s[i - 1]);
    if (l >= 15 && l <= 60) lens.push(l); // ignore implausible gaps (missed logs)
  }
  return lens;
}

export function averageCycle(starts: DateStr[], fallback = DEFAULT_SETTINGS.cycleLength): number {
  const lens = cycleLengths(starts).slice(-6); // recent cycles matter most
  if (lens.length === 0) return fallback;
  return Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
}

export function cycleVariability(starts: DateStr[]): number {
  const lens = cycleLengths(starts).slice(-6);
  if (lens.length < 2) return 0;
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  return Math.sqrt(variance);
}

// ---------- cycle position ----------
export interface CycleInfo {
  cycleDay: number; // 1-based day within the cycle
  cycleStart: DateStr;
  cycleLength: number;
  ovulationDay: number; // 1-based
  phase: Phase;
  daysToNextPeriod: number;
  nextPeriod: DateStr;
  ovulationDate: DateStr;
  fertileStart: DateStr;
  fertileEnd: DateStr;
  uncertain: boolean; // true when cycles are irregular or little history
}

export function cycleInfoFor(
  date: DateStr,
  starts: DateStr[],
  settings: CycleSettings = DEFAULT_SETTINGS,
): CycleInfo | null {
  const s = cleanStarts(starts);
  if (s.length === 0) return null;

  const avg = averageCycle(s, settings.cycleLength);
  // latest known start on/before the date; if date is before first start, project backwards
  let start = s[0];
  for (const x of s) if (diffDays(x, date) <= 0) start = x;
  let offset = diffDays(date, start);
  // project forward through predicted cycles when the date is beyond the last logged start
  if (offset >= 0) {
    const cycles = Math.floor(offset / avg);
    start = addDays(start, cycles * avg);
    offset = diffDays(date, start);
  } else {
    const cycles = Math.ceil(-offset / avg);
    start = addDays(start, -cycles * avg);
    offset = diffDays(date, start);
  }
  const cycleDay = offset + 1;
  const ovulationDay = avg - settings.lutealLength + 1;
  const ovulationDate = addDays(start, ovulationDay - 1);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  const nextPeriod = addDays(start, avg);

  let phase: Phase;
  if (cycleDay <= settings.periodLength) phase = 'period';
  else if (cycleDay === ovulationDay) phase = 'ovulation';
  else if (cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1) phase = 'fertile';
  else if (cycleDay < ovulationDay) phase = 'follicular';
  else if (cycleDay > avg - 5) phase = 'pms';
  else phase = 'luteal';

  return {
    cycleDay,
    cycleStart: start,
    cycleLength: avg,
    ovulationDay,
    phase,
    daysToNextPeriod: diffDays(nextPeriod, date),
    nextPeriod,
    ovulationDate,
    fertileStart,
    fertileEnd,
    uncertain: cycleLengths(s).length < 2 || cycleVariability(s) > 3,
  };
}

// ---------- pregnancy risk meter ----------
export interface RiskResult {
  level: RiskLevel;
  label: (typeof RISK_LABELS)[number];
  percent: number; // 0..100 gauge position (an indicator, NOT a probability)
  uncertain: boolean;
  reason: string;
}

/**
 * Calendar-method estimate only. It is deliberately conservative:
 * - irregular cycles or little history bump the level up one step and are flagged "uncertain"
 * - it is never "zero": the lowest level is "Very low", not "Safe".
 */
export function pregnancyRisk(date: DateStr, starts: DateStr[], settings: CycleSettings = DEFAULT_SETTINGS): RiskResult | null {
  const info = cycleInfoFor(date, starts, settings);
  if (!info) return null;
  const rel = diffDays(date, info.ovulationDate); // 0 = ovulation day

  let level: RiskLevel;
  let reason: string;
  if (rel === 0 || rel === -1) { level = 4; reason = 'Around ovulation, the most fertile days'; }
  else if (rel === -2) { level = 3; reason = 'Fertile window, 2 days before ovulation'; }
  else if (rel === 1 || rel === -3) { level = 3; reason = rel === 1 ? 'Egg can still be viable after ovulation' : 'Fertile window, sperm can survive for days'; }
  else if (rel === -4 || rel === -5 || rel === 2) { level = 2; reason = 'Edge of the fertile window'; }
  else if (info.phase === 'period') { level = 1; reason = 'During period, lower but not zero'; }
  else if (rel > 2) { level = 0; reason = 'Late in the cycle, lowest estimated risk'; }
  else { level = 1; reason = 'Early follicular phase, low estimated risk'; }

  const uncertain = info.uncertain;
  if (uncertain && level < 4) {
    level = (level + 1) as RiskLevel;
    reason += ' (raised one step: your cycles are irregular or we have little history)';
  }
  const percent = [8, 28, 52, 76, 96][level];
  return { level, label: RISK_LABELS[level], percent, uncertain, reason };
}

// ---------- mood ----------
export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6;
export const MOODS: { level: MoodLevel; name: string; short: string; color: string }[] = [
  { level: 6, name: 'Feeling Spicy', short: 'Spicy', color: '#FF5C8A' },
  { level: 5, name: 'Green Signal', short: 'Green', color: '#FF7A59' },
  { level: 4, name: 'Safe to Talk', short: 'Talk', color: '#FFC857' },
  { level: 3, name: 'Proceed Carefully', short: 'Careful', color: '#8ED1A0' },
  { level: 2, name: 'Danger Ahead', short: 'Danger', color: '#6FB1FF' },
  { level: 1, name: 'Bring Chocolate Now', short: 'Choc', color: '#A78BFA' },
];
export function moodName(l: MoodLevel): string {
  return MOODS.find((m) => m.level === l)!.name;
}

/** Typical tendency by phase, shown as a gentle forecast. A tendency, not a diagnosis. */
export function expectedMood(phase: Phase): MoodLevel {
  switch (phase) {
    case 'ovulation': return 6;
    case 'fertile': return 5;
    case 'follicular': return 4;
    case 'luteal': return 3;
    case 'pms': return 2;
    case 'period': return 2;
  }
}

export const PHASE_TIPS: Record<Phase, string> = {
  period: 'Cozy mode. Warm drinks, rest and extra patience help.',
  follicular: 'Energy is usually rising. A good time for plans.',
  fertile: 'Often social and upbeat. Fertile window is open.',
  ovulation: 'Usually the high point of the cycle.',
  luteal: 'Energy can dip. Keep things calm and simple.',
  pms: 'Mood swings are common now. Snacks and kindness win.',
};

/** Light-hearted tips for the partner view. Estimates, not facts about any one person. */
export const PARTNER_TIPS: Record<Phase, string> = {
  period: 'Be extra kind. Warm tea, a hot water bottle, no arguments.',
  follicular: 'Good energy. Plan something fun together.',
  fertile: 'Upbeat and social. A great day for a date.',
  ovulation: 'Peak mood. Enjoy it.',
  luteal: 'Keep it calm and help around the house.',
  pms: 'Handle with care. Chocolate helps. Never say "calm down".',
};
