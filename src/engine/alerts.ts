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

/**
 * Evening heads-up (19:00) the day BEFORE a person's mood is expected to drop to Danger Ahead or
 * Bring Chocolate Now, so there is time to prepare. Pure; the phone only schedules the result.
 */
export function planHeadsUps(people: AlertPerson[], from: DateStr = todayStr(), days = 45): MoodAlert[] {
  const out: MoodAlert[] = [];
  for (const p of people) {
    if (p.starts.length === 0) continue;
    let prev: MoodLevel | null = null;
    for (let i = 0; i <= days; i++) {
      const d = addDays(from, i);
      const info = cycleInfoFor(d, p.starts, p.settings);
      if (!info) continue;
      const level = expectedMood(info.phase);
      if (i > 0 && prev !== null && level !== prev && level <= 2) {
        const who = p.mode === 'self' ? 'You may be' : `${p.name} may be`;
        const choc = p.mode === 'self' ? 'Treat yourself and rest up.' : 'Chocolate and a kind word go a long way.';
        out.push({
          date: addDays(d, -1), name: p.name, level,
          title: 'Divi heads-up \u{1F36B}',
          body: `Tomorrow ${who.toLowerCase().startsWith('you') ? 'you' : p.name} could be ${moodName(level)}. ${choc}`,
        });
      }
      prev = level;
    }
  }
  return out.filter((a) => a.date > from).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * One notification per day per person (delivered at 14:00) telling today's expected mood.
 * `budget` caps the total so iOS's 64 pending-notification limit is never exceeded.
 */
export function planDailyAlerts(people: AlertPerson[], from: DateStr = todayStr(), budget = 44): MoodAlert[] {
  const tracked = people.filter((p) => p.starts.length > 0);
  if (tracked.length === 0) return [];
  const days = Math.max(1, Math.min(30, Math.floor(budget / tracked.length)));
  const out: MoodAlert[] = [];
  for (const p of tracked) {
    let prev: MoodLevel | null = null;
    for (let i = -1; i < days; i++) {
      const d = addDays(from, i);
      const info = cycleInfoFor(d, p.starts, p.settings);
      if (!info) continue;
      const level = expectedMood(info.phase);
      if (i >= 0) {
        const who = p.mode === 'self' ? 'You are' : `${p.name} is`;
        const changed = prev !== null && prev !== level;
        out.push({
          date: d, name: p.name, level,
          title: `Divi: ${p.mode === 'self' ? 'your' : `${p.name}'s`} mood today ${EMOJI[level]}`,
          body: `${who} likely ${moodName(level)}${changed ? ' (a change from yesterday)' : ''}. ${(p.mode === 'partner' ? PARTNER_TIPS : PHASE_TIPS)[info.phase]}`,
        });
      }
      prev = level;
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
