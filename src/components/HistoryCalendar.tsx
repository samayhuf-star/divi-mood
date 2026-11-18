import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { fmt, parse, todayStr, type CycleSettings, type DateStr } from '../engine/cycle';
import type { Flow } from '../theme';
import { KIND_LABEL, KIND_STYLE, LEGEND_ORDER, dayKind } from './calendarKinds';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = (d: DateStr) => parse(d).toDateString().slice(4, 10);

/** Full-screen list of past months (this month first, then back one year) with the same colours. */
export default function HistoryCalendar({ visible, starts, flows, settings, onPick, onClose }: { visible: boolean; starts: DateStr[]; flows: Record<DateStr, Flow>; settings: CycleSettings; onPick: (d: DateStr) => void; onClose: () => void }) {
  const today = todayStr();
  const months = useMemo(() => {
    const t = parse(today);
    return Array.from({ length: 13 }, (_, i) => {
      const y = t.getFullYear(), mo = t.getMonth() - i;
      const first = new Date(y, mo, 1, 12);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells: (DateStr | null)[] = Array(first.getDay()).fill(null);
      for (let d = 1; d <= days; d++) cells.push(fmt(new Date(first.getFullYear(), first.getMonth(), d, 12)));
      while (cells.length % 7) cells.push(null);
      const key = fmt(first).slice(0, 7);
      return { key, title: `${MONTHS[first.getMonth()]} ${first.getFullYear()}`, cells, started: starts.filter((s) => s.startsWith(key)) };
    });
  }, [today, starts]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.page}>
        <View style={s.top}>
          <Text style={s.h}>📅 Past months</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Text style={s.close}>Close</Text></Pressable>
        </View>
        <View style={s.legend}>
          {LEGEND_ORDER.map((k) => (
            <View key={k} style={s.chip}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: KIND_STYLE[k].bg, borderWidth: KIND_STYLE[k].border ? 2 : 1, borderColor: KIND_STYLE[k].border ?? '#E4D9EE', borderStyle: KIND_STYLE[k].dashed ? 'dashed' : 'solid' }} />
              <Text style={s.legendTxt}>{KIND_LABEL[k]}</Text>
            </View>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {months.map((mo) => (
            <View key={mo.key} style={s.card}>
              <View style={s.cardHead}>
                <Text style={s.title}>{mo.title}</Text>
                {mo.started.length > 0 && <Text style={s.started}>🩸 Started {mo.started.map(SHORT).join(', ')}</Text>}
              </View>
              <View style={s.row}>{DOW.map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}</View>
              <View style={s.grid}>
                {mo.cells.map((d, i) => {
                  if (!d) return <View key={i} style={s.cell} />;
                  const kind = dayKind(d, starts, flows, settings, today);
                  const st = kind ? KIND_STYLE[kind] : null;
                  return (
                    <Pressable key={i} style={s.cell} onPress={() => onPick(d)} accessibilityLabel={`Open ${d}`}>
                      <View style={[s.day, st && { backgroundColor: st.bg }, st?.border && { borderWidth: 2, borderColor: st.border, borderStyle: st.dashed ? 'dashed' : 'solid' }, d === today && { borderWidth: 2, borderColor: C.lilac, borderStyle: 'solid' }]}>
                        <Text style={[s.num, st?.white && { color: '#fff', fontWeight: '800' }]}>{Number(d.slice(8))}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, paddingTop: 54 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 },
  h: { fontSize: 22, fontWeight: '900', color: C.ink },
  close: { fontSize: 16, fontWeight: '800', color: C.pink },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8, rowGap: 2, paddingHorizontal: 14, paddingVertical: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendTxt: { fontSize: 11, color: C.sub, fontWeight: '600' },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 10, marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '800', color: C.ink },
  started: { fontSize: 11, fontWeight: '700', color: C.period },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 10, color: C.sub, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 1.5 },
  day: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 12, color: C.ink, fontWeight: '600' },
});
