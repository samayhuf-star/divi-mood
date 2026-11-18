// Late-period detection and the doctor summary. Pure functions: no React, no storage.
import { addDays, averageCycle, cleanStarts, cycleLengths, cycleVariability, diffDays, parse, type CycleSettings, type DateStr } from './cycle';

/** A period counts as late once it is MORE than this many days past the expected date. */
export const LATE_AFTER = 2;
/** Past this many days we assume logging simply stopped, so no late nudge. */
const STALE_AFTER = 90;

export interface LateStatus {
  late: boolean;
  daysLate: number; // negative = not due yet
  expected: DateStr;
  lastStart: DateStr;
}

export function lateStatus(today: DateStr, starts: DateStr[], settings: CycleSettings): LateStatus | null {
  const s = cleanStarts(starts);
  if (s.length === 0) return null;
  const lastStart = s[s.length - 1];
  if (diffDays(today, lastStart) < 0) return null; // last start is in the future
  const expected = addDays(lastStart, averageCycle(s, settings.cycleLength));
  const daysLate = diffDays(today, expected);
  return { late: daysLate > LATE_AFTER && daysLate <= STALE_AFTER, daysLate, expected, lastStart };
}

const short = (d: DateStr) => parse(d).toDateString().slice(4);

/** Number of consecutive bleeding days (spotting excluded) starting at `start`. */
function bleedingDays(start: DateStr, flows: Record<DateStr, string>): number {
  let n = 0;
  while (flows[addDays(start, n)] && flows[addDays(start, n)] !== 'spotting') n++;
  return n;
}

export interface SummaryInput {
  name: string;
  starts: DateStr[];
  flows: Record<DateStr, string>;
  settings: CycleSettings;
}

/** Plain-text cycle summary to show or send to a doctor. Self-logged data, never a diagnosis. */
export function doctorSummary(p: SummaryInput, today: DateStr): string {
  const s = cleanStarts(p.starts);
  const lines: string[] = [];
  lines.push(`Cycle summary for ${p.name}`);
  lines.push(`Created ${short(today)} with Divi Mood`);
  lines.push('');
  if (s.length === 0) {
    lines.push('No periods logged yet.');
  } else {
    const lens = cycleLengths(s);
    const avg = averageCycle(s, p.settings.cycleLength);
    const last = s[s.length - 1];
    const durations = s.map((d) => bleedingDays(d, p.flows)).filter((n) => n > 0);
    const avgBleed = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : p.settings.periodLength;
    lines.push(`Last period started: ${short(last)} (${diffDays(today, last)} days ago)`);
    lines.push(`Average cycle length: ${avg} days${lens.length >= 2 ? ` (shortest ${Math.min(...lens)}, longest ${Math.max(...lens)})` : ' (estimate, little history)'}`);
    lines.push(`Typical bleeding: ${avgBleed} days`);
    if (lens.length >= 2) lines.push(`Cycle regularity: ${cycleVariability(s) <= 3 ? 'fairly regular' : 'irregular (varies by more than 3 days)'}`);
    const st = lateStatus(today, s, p.settings);
    if (st) lines.push(st.daysLate > 0 ? `Next period expected ${short(st.expected)}: ${st.daysLate} day${st.daysLate === 1 ? '' : 's'} late` : `Next period expected ${short(st.expected)}`);
    lines.push('');
    lines.push('Recent periods (newest first):');
    const recent = s.slice(-6).reverse();
    for (const d of recent) {
      const i = s.indexOf(d);
      const next = s[i + 1];
      const len = next ? `${diffDays(next, d)} day cycle` : 'current cycle';
      const b = bleedingDays(d, p.flows);
      lines.push(`- ${short(d)}: ${b > 0 ? `${b} day${b === 1 ? '' : 's'} of bleeding` : 'bleeding days not logged'}, ${len}`);
    }
  }
  lines.push('');
  lines.push('Dates are self-logged in a phone app. They are not a diagnosis or a medical measurement.');
  return lines.join('\n');
}
