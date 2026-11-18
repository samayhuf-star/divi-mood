import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { fmt, parse, todayStr, type CycleSettings, type DateStr } from '../engine/cycle';
import type { Flow } from '../theme';
import { KIND_LABEL, KIND_STYLE, LEGEND_ORDER, dayKind, type Kind } from './calendarKinds';

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
  onCollapse?: () => void;
}

export default function Calendar({ month, onMonth, selected, onSelect, starts, flows, settings, hideLegend, onCollapse }: Props) {
  const m = parse(month);
  const year = m.getFullYear();
  const mon = m.getMonth();
  const today = todayStr();
  const [focus, setFocus] = useState<Kind | null>(null); // tap a legend colour to light up only those dates

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
  const shiftRef = useRef(shift);
  shiftRef.current = shift;
  // drag up = later month, drag down = earlier month
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 14 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderRelease: (_, g) => { if (g.dy < -40) shiftRef.current(1); else if (g.dy > 40) shiftRef.current(-1); },
  })).current;

  const focusKind = (k: Kind) => setFocus((f) => (f === k || (k === 'period' && f === 'periodLight') ? null : k));

  return (
    <View style={s.wrap} {...pan.panHandlers}>
      <View style={s.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="Previous month"><Text style={s.arrow}>‹</Text></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.title}>{MONTHS[mon]} {year}</Text>
          <Text style={s.hint}>drag up or down for months</Text>
        </View>
        <Pressable onPress={() => shift(1)} hitSlop={12} accessibilityLabel="Next month"><Text style={s.arrow}>›</Text></Pressable>
      </View>
      <View style={s.row}>
        {DOW.map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}
      </View>
      <View style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={s.cell} />;
          const kind = dayKind(d, starts, flows, settings, today);
          const st = kind ? KIND_STYLE[kind] : null;
          const dim = focus && kind !== focus && !(focus === 'period' && kind === 'periodLight');
          const isSel = d === selected;
          return (
            <Pressable key={i} style={s.cell} onPress={() => onSelect(d)} accessibilityLabel={`Select ${d}`}>
              <View
                style={[
                  s.day,
                  st && { backgroundColor: st.bg },
                  st?.border && { borderWidth: 2, borderColor: st.border, borderStyle: st.dashed ? 'dashed' : 'solid' },
                  dim && { opacity: 0.25 },
                  isSel && { borderWidth: 2.5, borderColor: C.ink, borderStyle: 'solid' },
                  d === today && !isSel && { borderWidth: 2, borderColor: C.lilac, borderStyle: 'solid' },
                ]}
              >
                <Text style={[s.num, st?.white && { color: '#fff', fontWeight: '800' }]}>{Number(d.slice(8))}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!hideLegend && <View style={s.legend}>
        {LEGEND_ORDER.map((k) => (
          <Pressable key={k} onPress={() => focusKind(k)} accessibilityLabel={`Highlight ${KIND_LABEL[k]} days`} style={[s.chip, focus === k && s.chipOn]}>
            <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: KIND_STYLE[k].bg, borderWidth: KIND_STYLE[k].border ? 2 : 1, borderColor: KIND_STYLE[k].border ?? '#E4D9EE', borderStyle: KIND_STYLE[k].dashed ? 'dashed' : 'solid' }} />
            <Text style={s.legendTxt}>{KIND_LABEL[k]}</Text>
          </Pressable>
        ))}
      </View>}
      {onCollapse && (
        <Pressable onPress={onCollapse} hitSlop={8} accessibilityLabel="Minimise calendar" style={s.collapse}>
          <Text style={s.collapseTxt}>⌃ Minimise</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { ...({ userSelect: 'none' } as object), backgroundColor: C.card, borderRadius: 24, padding: 12, shadowColor: '#C58BA5', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: C.ink },
  hint: { fontSize: 9, color: C.sub, marginTop: -1 },
  arrow: { fontSize: 28, color: C.pink, fontWeight: '700', paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, color: C.sub, fontWeight: '700', paddingVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 13, color: C.ink, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 4, rowGap: 2, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  chipOn: { backgroundColor: C.pinkSoft },
  legendTxt: { fontSize: 11, color: C.sub, fontWeight: '600' },
  collapse: { alignSelf: 'center', marginTop: 4, paddingHorizontal: 12, paddingVertical: 3 },
  collapseTxt: { fontSize: 12, fontWeight: '800', color: C.pink },
});
