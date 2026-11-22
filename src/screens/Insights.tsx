import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { MOODS, PARTNER_TIPS, addDays, cycleInfoFor, expectedMood, moodName, fertileStatus, todayStr } from '../engine/cycle';
import { useStore } from '../store';

const nice = (d: string) => new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8)), 12).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function Insights({ premium, onUnlock }: { premium: boolean; onUnlock: () => void }) {
  const { periodStarts, moods, settings, mode } = useStore();
  const partner = mode === 'partner';
  const week = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), i));
  const EMO: Record<number, string> = { 6: '😉', 5: '😍', 4: '😊', 3: '😐', 2: '😠', 1: '😢' };
  const today = todayStr();
  const info = cycleInfoFor(today, periodStarts, settings);
  // show the NEXT ovulation / fertile window, not one that already passed this cycle
  const shift = info && info.fertileEnd < today ? info.cycleLength : 0;
  const ovNext = info ? addDays(info.ovulationDate, shift) : '';
  const fsNext = info ? addDays(info.fertileStart, shift) : '';
  const feNext = info ? addDays(info.fertileEnd, shift) : '';
  const fertile = fertileStatus(today, periodStarts, settings);
  const logged = Object.keys(moods).sort();
  let streak = 0;
  for (let d = moods[today] ? today : addDays(today, -1); moods[d]; d = addDays(d, -1)) streak++;
  const avg = logged.length ? logged.reduce((a, d) => a + moods[d], 0) / logged.length : 0;
  const counts: Record<number, number> = {};
  logged.forEach((d) => { counts[moods[d]] = (counts[moods[d]] || 0) + 1; });
  const topLvl = Object.keys(counts).sort((a, b) => counts[Number(b)] - counts[Number(a)])[0];
  const topMood = topLvl ? MOODS.find((x) => x.level === Number(topLvl)) : null;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.h}>Today</Text>

      {partner ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>Wifey's mood forecast</Text>
          {premium ? (
            week.map((d) => {
              const i = cycleInfoFor(d, periodStarts, settings);
              if (!i) return null;
              const lvl = expectedMood(i.phase);
              return (
                <View key={d} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>{EMO[lvl]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.ink, fontWeight: '800' }}>{d === todayStr() ? 'Today' : nice(d)} · {moodName(lvl)}</Text>
                    <Text style={{ color: C.sub, fontSize: 12 }}>{PARTNER_TIPS[i.phase]}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Pressable onPress={onUnlock} style={s.lock}>
              <Text style={{ fontSize: 34 }}>🔒</Text>
              <Text style={{ color: C.ink, fontWeight: '800', marginTop: 4 }}>Unlock the 7-day forecast</Text>
              <Text style={{ color: C.sub, marginTop: 2 }}>7-day free trial</Text>
            </Pressable>
          )}
          <Text style={s.warn}>A light-hearted guess based on what you entered. Moods vary from day to day and person to person, and she is the real expert on how she feels.</Text>
        </View>
      ) : (
      <View style={s.card}>
        <Text style={s.cardTitle}>Fertile window (estimate)</Text>
        {fertile ? (
          <>
            <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: '900', color: C.ink, marginTop: 6 }}>{fertile.label}</Text>
            <Text style={s.reason}>{fertile.state === 'passed' ? 'Next estimated window' : 'Estimated window'}: {nice(fertile.start)} – {nice(fertile.end)}</Text>
            <Text style={s.reason}>Ovulation (est.): {nice(fertile.ovulation)}</Text>
            {fertile.uncertain && <Text style={s.reason}>Less certain: irregular cycles or little history</Text>}
          </>
        ) : (
          <Text style={s.reason}>Add a period start date to see an estimate.</Text>
        )}
        <Text style={s.warn}>
          These dates are a calendar-based estimate and can be wrong, especially with irregular cycles. They say nothing about the chance of pregnancy on any day and are not birth control or medical advice. Ask a doctor if unsure.
        </Text>
      </View>
      )}

      {info && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Your cycle</Text>
          <Row k="Cycle day" v={`${info.cycleDay} of ${info.cycleLength}`} />
          <Row k="Next period" v={`${nice(info.nextPeriod)} (in ${info.daysToNextPeriod} days)`} />
          <Row k="Ovulation (est.)" v={nice(ovNext)} />
          <Row k="Fertile window (est.)" v={`${nice(fsNext)} – ${nice(feNext)}`} />
          {info.uncertain && <Text style={s.note}>Dates are less certain until a few more cycles are logged.</Text>}
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTitle}>Mood insights</Text>
        {logged.length === 0 ? (
          <Text style={s.note}>Tap a mood on Home each day. Streaks and patterns show up here.</Text>
        ) : (
          <>
            <Row k="Logging streak" v={`${streak} day${streak === 1 ? '' : 's'} 🔥`} />
            <Row k="Days logged" v={String(logged.length)} />
            <Row k="Average mood" v={`${avg.toFixed(1)} / 6`} />
            {topMood && <Row k="Most common" v={topMood.name} />}
          </>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Mood, last 14 days</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4, marginTop: 8 }}>
          {days.map((d) => {
            const lvl = moods[d];
            const m = lvl ? MOODS.find((x) => x.level === lvl)! : null;
            return (
              <View key={d} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', height: lvl ? lvl * 18 : 6, borderRadius: 8, backgroundColor: m ? m.color : C.line }} />
                <Text style={{ fontSize: 9, color: C.sub, marginTop: 3 }}>{Number(d.slice(8))}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.note}>Taller bar = better mood. Grey = not logged.</Text>
      </View>
    </ScrollView>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
    <Text style={{ color: C.sub }}>{k}</Text>
    <Text style={{ color: C.ink, fontWeight: '700' }}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  h: { fontSize: 28, fontWeight: '900', color: C.ink, marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.ink, marginBottom: 6 },
  reason: { textAlign: 'center', color: C.sub, marginTop: 6 },
  warn: { fontSize: 12, color: '#9B6B00', backgroundColor: '#FFF0D6', borderRadius: 12, padding: 10, marginTop: 12, lineHeight: 17 },
  note: { fontSize: 12, color: C.sub, marginTop: 8 },
  lock: { alignItems: 'center', paddingVertical: 20, backgroundColor: C.bg, borderRadius: 16 },
});
