import {
  addDays, averageCycle, cleanStarts, cycleInfoFor, cycleLengths, cycleVariability,
  diffDays, expectedMood, fertileStatus,
} from './cycle';

const regular = ['2026-08-01', '2026-08-29', '2026-09-26', '2026-10-24']; // 28-day cycles

describe('date helpers', () => {
  it('adds days across month and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-07', 3)).toBe('2026-03-10');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(diffDays('2026-11-02', '2026-10-30')).toBe(3);
  });
});

describe('cycle stats', () => {
  it('computes lengths and average', () => {
    expect(cycleLengths(regular)).toEqual([28, 28, 28]);
    expect(averageCycle(regular)).toBe(28);
    expect(cycleVariability(regular)).toBe(0);
  });
  it('falls back to default with no history', () => {
    expect(averageCycle([])).toBe(28);
    expect(averageCycle(['2026-10-01'])).toBe(28);
  });
  it('merges duplicate/close starts and ignores implausible gaps', () => {
    expect(cleanStarts(['2026-10-01', '2026-10-03', '2026-10-01'])).toEqual(['2026-10-01']);
    expect(cycleLengths(['2026-01-01', '2026-06-01'])).toEqual([]);
  });
});

describe('cycleInfoFor', () => {
  it('returns null with no data', () => {
    expect(cycleInfoFor('2026-11-17', [])).toBeNull();
  });
  it('finds period phase and ovulation on cycle day 15 for 28-day cycles', () => {
    const p = cycleInfoFor('2026-10-25', regular)!;
    expect(p.cycleDay).toBe(2);
    expect(p.phase).toBe('period');
    expect(p.ovulationDay).toBe(15);
    const o = cycleInfoFor('2026-11-07', regular)!; // day 15 of cycle starting 10-24
    expect(o.cycleDay).toBe(15);
    expect(o.phase).toBe('ovulation');
    expect(o.nextPeriod).toBe('2026-11-21');
  });
  it('projects forward past the last logged start', () => {
    const f = cycleInfoFor('2026-12-10', regular)!; // beyond predicted 11-21 start
    expect(f.cycleStart).toBe('2026-11-21');
    expect(f.cycleDay).toBe(20);
  });
  it('projects backwards before first logged start', () => {
    const b = cycleInfoFor('2026-07-25', regular)!;
    expect(b.cycleStart).toBe('2026-07-04');
  });
  it('marks PMS in the last 5 days', () => {
    expect(cycleInfoFor('2026-11-18', regular)!.phase).toBe('pms');
  });
  it('flags uncertainty for short history and irregular cycles', () => {
    expect(cycleInfoFor('2026-10-30', ['2026-10-24'])!.uncertain).toBe(true);
    const irregular = ['2026-06-01', '2026-06-25', '2026-07-30', '2026-08-22', '2026-09-30'];
    expect(cycleInfoFor('2026-10-05', irregular)!.uncertain).toBe(true);
    expect(cycleInfoFor('2026-10-30', regular)!.uncertain).toBe(false);
  });
});

describe('fertileStatus', () => {
  it('is open across the estimated window, regular cycles', () => {
    expect(fertileStatus('2026-11-07', regular)!.state).toBe('open');
    expect(fertileStatus('2026-11-02', regular)!.state).toBe('open');
    expect(fertileStatus('2026-11-08', regular)!.state).toBe('open');
  });
  it('counts down before the window and points to the next one after it', () => {
    const before = fertileStatus('2026-10-30', regular)!;
    expect(before.state).toBe('upcoming');
    expect(before.label).toBe('Opens in 3 days');
    const after = fertileStatus('2026-11-15', regular)!;
    expect(after.state).toBe('passed');
    expect(after.start > '2026-11-15').toBe(true);
  });
  it('gives dates only, never a likelihood or a safety claim', () => {
    const labels = Array.from({ length: 60 }, (_, i) => fertileStatus(addDays('2026-10-24', i), regular)!.label).join(' ');
    expect(labels).not.toMatch(/safe|risk|low|high|chance/i);
  });
  it('flags little history as uncertain', () => {
    expect(fertileStatus('2026-10-30', ['2026-10-24'])!.uncertain).toBe(true);
  });
  it('returns null with no data', () => {
    expect(fertileStatus('2026-11-17', [])).toBeNull();
  });
});

describe('expectedMood', () => {
  it('maps every phase to a valid level', () => {
    for (const p of ['period', 'follicular', 'fertile', 'ovulation', 'luteal', 'pms'] as const) {
      expect(expectedMood(p)).toBeGreaterThanOrEqual(1);
      expect(expectedMood(p)).toBeLessThanOrEqual(6);
    }
  });
});
