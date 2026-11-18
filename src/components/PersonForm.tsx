import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { C } from '../theme';
import { addDays, cycleInfoFor, diffDays, parse, todayStr, type DateStr } from '../engine/cycle';
import Calendar from './Calendar';
import { DEFAULT_SETTINGS } from '../engine/cycle';
import type { Mode, NewPerson } from '../store';


const PHASE_COLORS: Record<string, string> = { period: C.period, follicular: '#E4F4F4', fertile: C.mint, ovulation: C.mintDark, luteal: '#E4F4F4', pms: '#D9C9FF' };

/** Big − / + stepper with the value front and centre. */
const Stepper = ({ value, unit, min, max, onChange }: { value: number; unit: string; min: number; max: number; onChange: (n: number) => void }) => (
  <View style={s.stepper}>
    <Pressable onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} accessibilityLabel="Decrease" style={[s.stepBtn, value <= min && { opacity: 0.35 }]} hitSlop={8}>
      <Text style={s.stepTxt}>−</Text>
    </Pressable>
    <View style={{ alignItems: 'center', minWidth: 90 }}>
      <Text style={s.stepVal}>{value}</Text>
      <Text style={s.stepUnit}>{unit}</Text>
    </View>
    <Pressable onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} accessibilityLabel="Increase" style={[s.stepBtn, value >= max && { opacity: 0.35 }]} hitSlop={8}>
      <Text style={s.stepTxt}>+</Text>
    </Pressable>
  </View>
);

/** One bar segment per day of the cycle, coloured by phase, so the numbers become a picture. */
const CycleBar = ({ cycle, period }: { cycle: number; period: number }) => {
  const settings = { cycleLength: cycle, periodLength: period, lutealLength: 14 };
  const base = '2026-01-01';
  return (
    <View style={s.bar}>
      {Array.from({ length: cycle }, (_, i) => {
        const info = cycleInfoFor(addDays(base, i), [base], settings);
        return <View key={i} style={{ flex: 1, backgroundColor: PHASE_COLORS[info?.phase ?? 'follicular'] }} />;
      })}
    </View>
  );
};

const Choice = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[s.choice, on && { backgroundColor: C.pink, borderColor: C.pink }]}>
    <Text style={[s.choiceTxt, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

const NAMES: Record<Mode, string[]> = {
  self: ['Me'],
  partner: ['Wifey', 'Girlfriend', 'Mom', 'Sis', 'Bestie'],
};

/** Name the penguin + the 4 cycle questions. Used by onboarding and by "Add person". */
export default function PersonForm({ mode, submitLabel, onSubmit, initialName }: { mode: Mode; submitLabel: string; onSubmit: (p: NewPerson) => void; initialName?: string }) {
  const partner = mode === 'partner';
  const [name, setName] = useState(initialName ?? NAMES[mode][0]);
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(3);
  const [lastDate, setLastDate] = useState<DateStr>(() => addDays(todayStr(), -10));
  const [month, setMonth] = useState<DateStr>(() => addDays(todayStr(), -10));
  const [dont, setDont] = useState(false);
  const [regular, setRegular] = useState<'yes' | 'mostly' | 'no'>('yes');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}>
        <View style={s.card}>
          <Text style={s.q}>Name the penguin</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {NAMES[mode].map((n) => <Choice key={n} label={n} on={name === n} onPress={() => setName(n)} />)}
          </View>
          <TextInput value={name} onChangeText={setName} maxLength={20} placeholder="Or type a name" placeholderTextColor={C.sub} style={s.input} />
        </View>
        <View style={s.card}>
          <Text style={s.q}>{partner ? '1. When did her last period start?' : '1. When did your last period start?'}</Text>
          <Text style={s.sub}>{dont ? 'Skipped' : `Selected: ${parse(lastDate).toDateString().slice(0, 10)} (${diffDays(todayStr(), lastDate)} days ago)`}</Text>
          <View style={dont ? { opacity: 0.35 } : undefined} pointerEvents={dont ? 'none' : 'auto'}>
            <Calendar
              month={month}
              onMonth={setMonth}
              selected={lastDate}
              onSelect={(d) => { if (d <= todayStr()) { setDont(false); setLastDate(d); } }}
              starts={[]}
              flows={{ [lastDate]: 'medium' }}
              moods={{}}
              settings={DEFAULT_SETTINGS}
              hideLegend
            />
          </View>
          <Pressable onPress={() => setDont(!dont)} style={{ paddingBottom: 6 }}>
            <Text style={{ color: C.pink, fontWeight: '700' }}>{dont ? '✓ ' : ''}{partner ? "I don't know" : "I don't remember"}</Text>
          </Pressable>
        </View>
        <View style={s.card}>
          <Text style={s.q}>{partner ? '2. Are her cycles regular?' : '2. Are your cycles regular?'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Choice label="Yes" on={regular === 'yes'} onPress={() => setRegular('yes')} />
            <Choice label="Mostly" on={regular === 'mostly'} onPress={() => setRegular('mostly')} />
            <Choice label="Not really" on={regular === 'no'} onPress={() => setRegular('no')} />
          </View>
        </View>
        <View style={s.card}>
          <Text style={s.q}>3. Days between periods</Text>
          <Text style={s.sub}>Most cycles are about 28 days. Tap − or + to change it.</Text>
          <Stepper value={cycle} unit="days" min={20} max={45} onChange={setCycle} />
          <Text style={[s.q, { marginTop: 12 }]}>4. Days of bleeding</Text>
          <Stepper value={period} unit="days" min={1} max={10} onChange={setPeriod} />
          <CycleBar cycle={cycle} period={period} />
          <View style={s.keyRow}>
            <Text style={[s.key, { color: C.period }]}>● Period</Text>
            <Text style={[s.key, { color: C.mintDark }]}>● Fertile</Text>
            <Text style={[s.key, { color: '#9C84D8' }]}>● PMS</Text>
          </View>
        </View>
      </ScrollView>
      <Pressable
        style={s.btn}
        accessibilityRole="button"
        onPress={() => onSubmit({ name, mode, lastPeriod: dont ? null : lastDate, cycleLength: cycle, periodLength: period, irregular: regular === 'no' })}
      >
        <Text style={s.btnTxt}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginTop: 10 },
  q: { fontSize: 15, fontWeight: '800', color: C.ink },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optCard: { width: '48%', flexGrow: 1, paddingVertical: 14, borderRadius: 18, borderWidth: 2, borderColor: C.pinkSoft, backgroundColor: '#fff', alignItems: 'center' },
  optTop: { fontSize: 17, fontWeight: '900', color: C.ink },
  optSub: { fontSize: 12, fontWeight: '700', color: C.sub, marginTop: 2 },
  sub: { fontSize: 13, color: C.sub, fontWeight: '600', marginTop: 6 },
  input: { marginTop: 10, borderWidth: 2, borderColor: C.pinkSoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, fontSize: 16, color: C.ink },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  stepLabel: { fontSize: 15, color: C.sub, fontWeight: '600', flex: 1, paddingRight: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 8 },
  stepBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 30, color: '#fff', fontWeight: '800', marginTop: -3 },
  stepVal: { fontSize: 40, fontWeight: '900', color: C.ink },
  stepUnit: { fontSize: 12, fontWeight: '800', color: C.sub, marginTop: -4 },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginTop: 14, gap: 1 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  key: { fontSize: 11, fontWeight: '800' },
  choice: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: C.pinkSoft, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
  choiceTxt: { fontWeight: '800', color: C.ink },
  btn: { backgroundColor: C.pink, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
