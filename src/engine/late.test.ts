import { doctorSummary, lateStatus } from './late';
import { planLateAlerts } from './alerts';
import { DEFAULT_SETTINGS } from './cycle';

const S = { ...DEFAULT_SETTINGS, cycleLength: 28 };
const starts = ['2026-08-01', '2026-08-29', '2026-09-26']; // expected next 2026-10-24

describe('lateStatus', () => {
  it('is not late on or just after the expected date', () => {
    expect(lateStatus('2026-10-24', starts, S)?.late).toBe(false);
    expect(lateStatus('2026-10-26', starts, S)?.late).toBe(false); // 2 days
  });
  it('is late after more than 2 days', () => {
    const r = lateStatus('2026-10-27', starts, S)!;
    expect(r.late).toBe(true);
    expect(r.daysLate).toBe(3);
  });
  it('stops nudging when logging looks abandoned', () => {
    expect(lateStatus('2027-03-01', starts, S)?.late).toBe(false);
  });
  it('returns null without data', () => {
    expect(lateStatus('2026-10-27', [], S)).toBeNull();
  });
});

describe('planLateAlerts', () => {
  const p = { name: 'Neha', mode: 'partner' as const, starts, settings: S };
  it('schedules day 3 and day 7 past expected', () => {
    const a = planLateAlerts([p], '2026-10-01');
    expect(a.map((x) => x.date)).toEqual(['2026-10-27', '2026-10-31']);
  });
  it('skips past dates', () => {
    expect(planLateAlerts([p], '2026-10-29').map((x) => x.date)).toEqual(['2026-10-31']);
  });
});

describe('doctorSummary', () => {
  it('lists cycles and lateness', () => {
    const flows: Record<string, string> = { '2026-09-26': 'medium', '2026-09-27': 'light', '2026-09-28': 'light' };
    const t = doctorSummary({ name: 'Neha', starts, flows, settings: S }, '2026-10-27');
    expect(t).toContain('Average cycle length: 28 days');
    expect(t).toContain('3 days late');
    expect(t).toContain('3 days of bleeding');
    expect(t).toContain('not a diagnosis');
  });
});
