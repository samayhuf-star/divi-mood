import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { C } from '../theme';
import { addDays, diffDays, parse, todayStr, type DateStr } from '../engine/cycle';
import Calendar from './Calendar';
import { DEFAULT_SETTINGS } from '../engine/cycle';
import type { Mode, NewPerson } from '../store';

const CYCLE_OPTS = [{ v: 24, t: 'Short' }, { v: 28, t: 'Typical' }, { v: 32, t: 'Longer' }, { v: 36, t: 'Long' }];
const PERIOD_OPTS = [{ v: 3, t: 'Light' }, { v: 5, t: 'Typical' }, { v: 6, t: 'Longer' }, { v: 7, t: 'Long' }];

const Card = ({ top, sub, on, onPress }: { top: string; sub: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.optCard, on && { backgroundColor: C.pink, borderColor: C.pink }]}>
    <Text style={[s.optTop, on && { color: '#fff' }]}>{top}</Text>
    <Text style={[s.optSub, on && { color: '#E6FFFD' }]}>{sub}</Text>
  </Pressable>
);

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
export default function PersonForm({ mode, submitLabel, onSubmit }: { mode: Mode; submitLabel: string; onSubmit: (p: NewPerson) => void }) {
  const partner = mode === 'partner';
  const [name, setName] = useState(NAMES[mode][0]);
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(5);
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
          <Text style={s.q}>3. Usual days between periods</Text>
          <View style={s.cards}>
            {CYCLE_OPTS.map((o) => <Card key={o.v} top={`${o.v} days`} sub={o.t} on={cycle === o.v} onPress={() => setCycle(o.v)} />)}
          </View>
          <Text style={[s.q, { marginTop: 16 }]}>4. Usual days of bleeding</Text>
          <View style={s.cards}>
            {PERIOD_OPTS.map((o) => <Card key={o.v} top={`${o.v} days`} sub={o.t} on={period === o.v} onPress={() => setPeriod(o.v)} />)}
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
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 22, color: C.pink, fontWeight: '800', marginTop: -2 },
  stepVal: { fontSize: 18, fontWeight: '800', color: C.ink, minWidth: 28, textAlign: 'center' },
  choice: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: C.pinkSoft, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
  choiceTxt: { fontWeight: '800', color: C.ink },
  btn: { backgroundColor: C.pink, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
