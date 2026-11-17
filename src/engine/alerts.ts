import { addDays, cycleInfoFor, expectedMood, moodName, PARTNER_TIPS, PHASE_TIPS, todayStr, type CycleSettings, type DateStr, type MoodLevel } from './cycle';

export interface AlertPerson {
  name: string;
  mode: 'self' | 'partner';
  starts: DateStr[];
  settings: CycleSettings;
}
export interface MoodAlert { date: DateStr; name: string; level: MoodLevel; title: string; body: string }

const EMOJI: Record<MoodLevel, string> = { 6: '😉', 5: '😍', 4: '😊', 3: '😐', 2: '😠', 1: '😢' };

/**
 * One alert for every day on which a person's expected mood level differs from the day before.
 * Pure and deterministic so it can be unit tested; the phone only schedules the result.
 * Alerts are for dates after `from` (today's change is shown by the launch animation).
 */
export function planMoodAlerts(people: AlertPerson[], from: DateStr = todayStr(), days = 45, cap = 60): MoodAlert[] {
  const out: MoodAlert[] = [];
  for (const p of people) {
    if (p.starts.length === 0) continue;
    let prev: MoodLevel | null = null;
    for (let i = 0; i <= days; i++) {
      const d = addDays(from, i);
      const info = cycleInfoFor(d, p.starts, p.settings);
      if (!info) continue;
      const level = expectedMood(info.phase);
      if (i > 0 && prev !== null && level !== prev) {
        const tip = (p.mode === 'partner' ? PARTNER_TIPS : PHASE_TIPS)[info.phase];
        const who = p.mode === 'self' ? 'You are' : `${p.name} is`;
        out.push({
          date: d, name: p.name, level,
          title: `Divi: mood change ${EMOJI[level]}`,
          body: `${who} likely ${moodName(level)} today. ${tip}`,
        });
      }
      prev = level;
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out.slice(0, cap); // iOS keeps at most 64 pending local notifications
}
