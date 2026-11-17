import { planMoodAlerts } from './alerts';
import { DEFAULT_SETTINGS } from './cycle';

const p = { name: 'Wifey', mode: 'partner' as const, starts: ['2026-11-01'], settings: DEFAULT_SETTINGS };

test('alerts only on days the mood level changes, never on the start day', () => {
  const a = planMoodAlerts([p], '2026-11-17', 45);
  expect(a.length).toBeGreaterThan(2);
  expect(a.every((x) => x.date > '2026-11-17')).toBe(true);
  const dates = a.map((x) => x.date);
  expect(new Set(dates).size).toBe(dates.length);
  expect(a[0].body).toContain('Wifey is likely');
});
test('no history gives no alerts, and the cap holds', () => {
  expect(planMoodAlerts([{ ...p, starts: [] }])).toEqual([]);
  const many = Array.from({ length: 10 }, () => p);
  expect(planMoodAlerts(many, '2026-11-17', 90, 60).length).toBeLessThanOrEqual(60);
});
test('self mode speaks to the user', () => {
  const a = planMoodAlerts([{ ...p, mode: 'self' }], '2026-11-17', 45);
  expect(a[0].body.startsWith('You are likely')).toBe(true);
});

import { planHeadsUps } from './alerts';
describe('planHeadsUps', () => {
  it('warns the evening before a drop to low mood, never in the past', () => {
    const people = [{ name: 'Wifey', mode: 'partner' as const, starts: ['2026-10-01', '2026-10-29'], settings: { cycleLength: 28, periodLength: 5, lutealLength: 14 } }];
    const out = planHeadsUps(people, '2026-11-01');
    expect(out.length).toBeGreaterThan(0);
    out.forEach((a) => { expect(a.date > '2026-11-01').toBe(true); expect(a.level <= 2).toBe(true); });
  });
});
