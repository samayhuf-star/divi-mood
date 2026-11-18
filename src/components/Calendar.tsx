import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { cycleInfoFor, fmt, parse, todayStr, type CycleSettings, type DateStr } from '../engine/cycle';
import type { Flow } from '../theme';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  month: DateStr; // any date in the month shown
  onMonth: (d: DateStr) => void;
  selected: DateStr;
  onSelect: (d: DateStr) => void;
  starts: DateStr[];
  flows: Record<DateStr, Flow>;
  moods?: unknown;
  settings: CycleSettings;
  hideLegend?: boolean;
}

export default function Calendar({ month, onMonth, selected, onSelect, starts, flows, settings, hideLegend }: Props) {
  const m = parse(month);
  const year = m.getFullYear();
  const mon = m.getMonth();
  const today = todayStr();

  const cells = useMemo(() => {
    const first = new Date(year, mon, 1, 12);
    const lead = first.getDay();
    const days = new Date(year, mon + 1, 0).getDate();
    const out: (DateStr | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) out.push(fmt(new Date(year, mon, d, 12)));
    while (out.length % 7) out.push(null);
    return out;
  }, [year, mon]);

  const shift = (n: number) => onMonth(fmt(new Date(year, mon + n, 1, 12)));

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="Previous month"><Text style={s.arrow}>‹</Text></Pressable>
        <Text style={s.title}>{MONTHS[mon]} {year}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={12} accessibilityLabel="Next month"><Text style={s.arrow}>›</Text></Pressable>
      </View>
      <View style={s.row}>
        {DOW.map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}
      </View>
      <View style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={s.cell} />;
          const info = cycleInfoFor(d, starts, settings);
          const bleeding = !!flows[d] && flows[d] !== 'spotting';
          const predictedPeriod = !flows[d] && info?.phase === 'period' && d >= today;
          const fertile = info && (info.phase === 'fertile' || info.phase === 'ovulation');
          const isOv = info?.phase === 'ovulation';
          const isSel = d === selected;
          const pms = !bleeding && !predictedPeriod && info?.phase === 'pms';
          return (
            <Pressable key={i} style={s.cell} onPress={() => onSelect(d)} accessibilityLabel={`Select ${d}`}>
              <View
                style={[
                  s.day,
                  bleeding && { backgroundColor: C.period },
                  predictedPeriod && { borderWidth: 2, borderColor: C.period, borderStyle: 'dashed' },
                  !bleeding && !predictedPeriod && fertile && { backgroundColor: C.mint },
                  pms && { backgroundColor: '#EBE2FF' },
                  isOv && { borderWidth: 2, borderColor: C.mintDark },
                  isSel && { borderWidth: 2.5, borderColor: C.ink },
                  d === today && !isSel && { borderWidth: 2, borderColor: C.lilac },
                ]}
              >
                <Text style={[s.num, bleeding && { color: '#fff', fontWeight: '800' }]}>{Number(d.slice(8))}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!hideLegend && <View style={s.legend}>
        <Legend color={C.period} label="Period" />
        <Legend color="#fff" border={C.period} label="Expected" />
        <Legend color={C.mint} label="Fertile" />
        <Legend color="#fff" border={C.mintDark} label="Ovulation" />
        <Legend color="#EBE2FF" label="PMS" />
        <Legend color="#fff" border={C.lilac} label="Today" />
      </View>}
    </View>
  );
}

const Legend = ({ color, label, border }: { color: string; label: string; border?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: color, borderWidth: border ? 2 : 0, borderColor: border }} />
    <Text style={s.legendTxt}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: 24, padding: 12, shadowColor: '#C58BA5', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: C.ink },
  arrow: { fontSize: 28, color: C.pink, fontWeight: '700', paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, color: C.sub, fontWeight: '700', paddingVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 13, color: C.ink, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 10, rowGap: 2, marginTop: 4 },
  legendTxt: { fontSize: 11, color: C.sub },
});
