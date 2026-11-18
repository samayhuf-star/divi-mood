import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { lateStatus } from '../engine/late';
import { PHASE_TIPS, PARTNER_TIPS, cycleInfoFor, diffDays, parse, todayStr, type CycleSettings, type DateStr, type Phase } from '../engine/cycle';

const PHASE_NAME: Record<Phase, string> = { period: 'Period', follicular: 'Follicular', fertile: 'Fertile window', ovulation: 'Ovulation day', luteal: 'Luteal', pms: 'PMS days' };
const PHASE_COLOR: Record<Phase, string> = { period: C.period, follicular: C.sky, fertile: C.mint, ovulation: C.mintDark, luteal: C.sky, pms: '#D9C9FF' };
const SHORT = (d: DateStr) => parse(d).toDateString().slice(4, 10);
const IN = (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 0 ? `in ${n} days` : `${-n} days ago`);

/** Facts about the selected day: cycle day, phase and what is coming next. */
export default function DayInfo({ date, starts, settings, partner }: { date: DateStr; starts: DateStr[]; settings: CycleSettings; partner: boolean }) {
  const info = cycleInfoFor(date, starts, settings);
  if (!info) return <View style={s.box}><Text style={s.line}>Log a period start to see predictions.</Text></View>;
  const today = todayStr();
  const ls = date === today ? lateStatus(today, starts, settings) : null;
  const lateBy = ls && ls.daysLate > 0 ? ls.daysLate : 0;
  const ovIn = diffDays(info.ovulationDate, date);
  const fertIn = diffDays(info.fertileStart, date);
  const next = diffDays(info.nextPeriod, date);
  const tip = lateBy ? (partner ? 'Be gentle, no pressure. Stress and travel can shift a cycle.' : 'Stress, travel and sleep can shift a cycle. Log your period when it starts.') : (partner ? PARTNER_TIPS : PHASE_TIPS)[info.phase]);
  return (
    <View style={s.box}>
      <View style={s.head}>
        <View style={[s.chip, { backgroundColor: lateBy ? '#FFE3E0' : PHASE_COLOR[info.phase] }]}>
          <Text style={[s.chipTxt, !lateBy && info.phase === 'period' && { color: '#fff' }]}>{lateBy ? 'Period late' : PHASE_NAME[info.phase]}</Text>
        </View>
        <Text style={s.day}>{lateBy ? `Today · ${lateBy} day${lateBy === 1 ? '' : 's'} late` : `${date === today ? 'Today' : SHORT(date)} · Day ${info.cycleDay} of ${info.cycleLength}`}</Text>
      </View>
      <View style={s.cols}>
        <View style={s.col}><Text style={s.k}>{lateBy ? 'Was expected' : 'Next period'}</Text><Text style={s.v}>{lateBy && ls ? `${SHORT(ls.expected)} · ${IN(-lateBy)}` : `${SHORT(info.nextPeriod)} · ${IN(next)}`}</Text></View>
        <View style={s.col}>
          <Text style={s.k}>{ovIn >= 0 ? 'Ovulation' : 'Fertile window'}</Text>
          <Text style={s.v}>{ovIn >= 0 ? `${SHORT(info.ovulationDate)} · ${IN(ovIn)}` : `${SHORT(info.fertileStart)} · ${IN(diffDays(info.fertileStart, date))}`}</Text>
        </View>
      </View>
      <Text style={s.tip} numberOfLines={1}>{tip}{info.uncertain ? '  (estimate)' : ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  chipTxt: { fontSize: 12, fontWeight: '900', color: C.ink },
  day: { fontSize: 13, fontWeight: '800', color: C.ink },
  cols: { flexDirection: 'row', marginTop: 6, gap: 8 },
  col: { flex: 1 },
  k: { fontSize: 10, fontWeight: '800', color: C.sub, textTransform: 'uppercase' },
  v: { fontSize: 13, fontWeight: '800', color: C.ink },
  line: { fontSize: 12, fontWeight: '700', color: C.ink, marginTop: 5 },
  tip: { fontSize: 11, color: C.sub, fontWeight: '600', marginTop: 2 },
});
