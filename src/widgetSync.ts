import { Platform } from 'react-native';
import { addDays, cycleInfoFor, expectedMood, moodName, PARTNER_TIPS, PHASE_TIPS, todayStr, parse, type CycleSettings, type DateStr, type MoodLevel } from './engine/cycle';

const EMOJI: Record<MoodLevel, string> = { 6: '😉', 5: '😍', 4: '😊', 3: '😐', 2: '😠', 1: '😢' };

/** Gives the home-screen widget one entry per day for the next 14 days (mood expected for the active person). */
const WIDGET_ENABLED = true;
export function syncWidget(p: { name: string; mode: 'self' | 'partner'; starts: DateStr[]; settings: CycleSettings } | undefined): void {
  if (!WIDGET_ENABLED || Platform.OS !== 'ios' || !p || p.starts.length === 0) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MoodWidget = require('./widgets/MoodWidget').default;
    const today = todayStr();
    const entries = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(today, i);
      const info = cycleInfoFor(d, p.starts, p.settings);
      if (!info) continue;
      const lvl = expectedMood(info.phase);
      const when = parse(d);
      when.setHours(0, 5, 0, 0);
      entries.push({
        date: i === 0 ? new Date() : when,
        props: { who: p.mode === 'self' ? 'You' : p.name, emoji: EMOJI[lvl], mood: moodName(lvl), tip: (p.mode === 'self' ? PHASE_TIPS : PARTNER_TIPS)[info.phase] },
      });
    }
    if (entries.length) MoodWidget.updateTimeline(entries);
  } catch { /* the widget is a bonus; never crash the app */ }
}
