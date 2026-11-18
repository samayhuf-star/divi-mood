import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Calendar from '../components/Calendar';
import Penguin from '../components/Penguin';
import DayInfo from '../components/DayInfo';
import RiskMeter from '../components/RiskMeter';
import { C, FLOWS, RISK_COLORS } from '../theme';
import { cycleInfoFor, expectedMood, moodName, pregnancyRisk, todayStr, type MoodLevel } from '../engine/cycle';
import { useStore } from '../store';
import { useMoodSounds } from '../sound';
import ShareScreen from './ShareScreen';
import MessageIdeas from '../components/MessageIdeas';
import DoctorSummary from '../components/DoctorSummary';
import { lateStatus } from '../engine/late';


export default function Home({ premium, onUnlock, onAddPerson }: { premium: boolean; onUnlock: () => void; onAddPerson: () => void }) {
  const { periodStarts, flows, moods, settings, setFlow, mode, name, profiles, activeId, switchProfile } = useStore();
  const partner = mode === 'partner';
  const [selected, setSelected] = useState(todayStr());
  const [month, setMonth] = useState(todayStr());

  const info = cycleInfoFor(selected, periodStarts, settings);
  const risk = pregnancyRisk(selected, periodStarts, settings);
  const logged = moods[selected];
  const face: MoodLevel = logged ?? (info ? expectedMood(info.phase) : 3);
  const isFuture = selected > todayStr();

  // each mood has its own sound: plays whenever the penguin's mood changes (new mood, other day, other person)
  const play = useMoodSounds();
  const [pulse, setPulse] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const late = lateStatus(todayStr(), periodStarts, settings);
  const todayInfo = cycleInfoFor(todayStr(), periodStarts, settings);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    play(face);
    setPulse((n) => n + 1);
  }, [face, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1 }}>
      <ShareScreen visible={shareOpen} who={mode === 'self' ? 'You are' : name} level={face} onClose={() => setShareOpen(false)} />
      <MessageIdeas visible={ideasOpen} phase={(todayInfo ?? info)?.phase ?? 'follicular'} partner={partner} onClose={() => setIdeasOpen(false)} />
      <DoctorSummary visible={docOpen} name={name} starts={periodStarts} flows={flows} settings={settings} onClose={() => setDocOpen(false)} />
      {/* TOP HALF: people, calendar, dates, mood levels */}
      <View style={s.top}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {profiles.map((p) => (
            <Pressable key={p.id} onPress={() => switchProfile(p.id)} style={[s.who, p.id === activeId && s.whoOn]} accessibilityLabel={`Switch to ${p.name}`}>
              <Text style={[s.whoTxt, p.id === activeId && { color: '#fff' }]}>🐧 {p.name}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onAddPerson} style={s.who} accessibilityLabel="Add person"><Text style={s.whoTxt}>＋ Add person</Text></Pressable>
        </ScrollView>
        {late?.late && (
          <Pressable style={s.late} onPress={() => setDocOpen(true)} accessibilityLabel="Period late, open summary">
            <Text style={s.lateTxt}>⏰ {partner ? `${name}\u2019s` : 'Your'} period is {late.daysLate} days late · Tap for summary</Text>
          </Pressable>
        )}
        <Calendar month={month} onMonth={setMonth} selected={selected} onSelect={setSelected} starts={periodStarts} flows={flows} settings={settings} />
        <DayInfo date={selected} starts={periodStarts} settings={settings} partner={partner} />
      </View>

      {/* BOTTOM HALF: Divi, whose face follows the mood level */}
      <View style={s.bottom}>
        <Text style={s.caption}>{logged ? `${name} · ${moodName(logged)}` : info ? `${name} · likely ${moodName(face)}` : name}</Text>

        {!partner && <Pressable style={s.riskChip} onPress={premium ? undefined : onUnlock} accessibilityLabel="Pregnancy risk">
          <Text style={s.riskTitle}>Pregnancy risk</Text>
          {premium && risk ? (
            <>
              <RiskMeter risk={risk} compact />
            </>
          ) : (
            <Text style={{ fontSize: 13, color: C.pink, fontWeight: '800', marginTop: 6 }}>🔒 Plus</Text>
          )}
        </Pressable>}

        <View style={s.btnRow}>
          <Pressable style={s.shareBtn} onPress={() => setShareOpen(true)} accessibilityLabel="Share mood">
            <Text style={s.shareTxt}>📤 Share mood</Text>
          </Pressable>
          <Pressable style={s.shareBtn} onPress={() => setIdeasOpen(true)} accessibilityLabel="Message ideas">
            <Text style={s.shareTxt}>💌 Ideas</Text>
          </Pressable>
        </View>
        <Pressable style={s.pengWrap} onPress={() => { play(face); setPulse((n) => n + 1); }} accessibilityLabel="Tap the penguin">
          <Penguin level={face} size={248} pulse={pulse} />
        </Pressable>

        {partner ? (
          <View style={s.flowBar}>
            <Pressable disabled={isFuture} onPress={() => setFlow(selected, flows[selected] ? null : 'medium')} style={[s.flow, { paddingHorizontal: 16, paddingVertical: 9 }, flows[selected] && { backgroundColor: C.period }]}>
              <Text style={[s.flowTxt, { fontSize: 13 }, flows[selected] && { color: '#fff' }]}>
                {flows[selected] ? '✓ Her period is on this day (tap to undo)' : '🩸 Her period started this day'}
              </Text>
            </Pressable>
          </View>
        ) : (
        <View style={s.flowBar}>
          <Text style={s.flowLabel}>Flow</Text>
          {FLOWS.map((f) => {
            const on = flows[selected] === f.id;
            return (
              <Pressable key={f.id} disabled={isFuture} onPress={() => setFlow(selected, on ? null : f.id)} style={[s.flow, on && { backgroundColor: C.period }]}>
                <Text style={[s.flowTxt, on && { color: '#fff' }]}>{'💧'.repeat(f.drops)} {f.name}</Text>
              </Pressable>
            );
          })}
        </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  who: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: C.pinkSoft },
  whoOn: { backgroundColor: C.pink, borderColor: C.pink },
  whoTxt: { fontSize: 13, fontWeight: '800', color: C.ink },
  top: { paddingHorizontal: 14, paddingTop: 4 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  mood: { width: '15.6%', borderRadius: 16, borderWidth: 2, alignItems: 'center', paddingVertical: 5 },
  moodTxt: { fontSize: 10, fontWeight: '700', color: C.sub, marginTop: 1 },
  bottom: { flex: 1, marginTop: 6, backgroundColor: C.pinkSoft, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden', alignItems: 'center' },
  pengWrap: { position: 'absolute', bottom: 92, alignSelf: 'center' },
  btnRow: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 8, zIndex: 3 },
  late: { backgroundColor: '#FFE3E0', borderRadius: 14, paddingVertical: 7, paddingHorizontal: 12, marginBottom: 6 },
  lateTxt: { fontSize: 12, fontWeight: '800', color: '#A3372E' },
  shareBtn: { backgroundColor: C.pink, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  shareTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  caption: { position: 'absolute', top: 12, left: 16, fontSize: 15, fontWeight: '900', color: C.ink, zIndex: 2 },
  riskChip: { position: 'absolute', top: 12, right: 14, backgroundColor: '#fff', borderRadius: 18, padding: 8, alignItems: 'center', zIndex: 2, width: 138 },
  riskTitle: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase' },
  flowBar: { position: 'absolute', bottom: 56, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, zIndex: 3 },
  flowLabel: { fontSize: 11, fontWeight: '800', color: C.ink },
  flow: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6 },
  flowTxt: { fontSize: 11, fontWeight: '700', color: C.ink },
});

export { RISK_COLORS };
