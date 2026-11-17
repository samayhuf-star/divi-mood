import type { NewPerson } from './store';

// Serverless partner sharing: the code carries just name + last period + cycle numbers. Nothing is uploaded.
export function makeCode(p: { name: string; lastPeriod: string; cycleLength: number; periodLength: number }): string {
  return `DIVI-${[encodeURIComponent(p.name), p.lastPeriod, p.cycleLength, p.periodLength].join('.')}`;
}

export function parseCode(raw: string): NewPerson | null {
  const m = raw.trim().match(/DIVI-([^\s]+)/i);
  if (!m) return null;
  const [n, last, cl, pl] = m[1].split('.');
  const cycleLength = Number(cl), periodLength = Number(pl);
  if (!n || !/^\d{4}-\d{2}-\d{2}$/.test(last ?? '') || !(cycleLength >= 15 && cycleLength <= 60) || !(periodLength >= 1 && periodLength <= 14)) return null;
  let name = '';
  try { name = decodeURIComponent(n); } catch { return null; }
  return { name, mode: 'partner', lastPeriod: last, cycleLength, periodLength, irregular: false };
}
