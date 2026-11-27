import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HistoryCalendar from '../components/HistoryCalendar';
import Calendar from '../components/Calendar';
import Penguin from '../components/Penguin';
import DayInfo from '../components/DayInfo';
import { C, FLOWS } from '../theme';
import { MOODS, cycleInfoFor, expectedMood, moodName, fertileStatus, todayStr, type MoodLevel } from '../engine/cycle';
import { useStore } from '../store';
import { useMoodSounds } from '../sound';
import ShareScreen from './ShareScreen';
import MessageIdeas from '../components/MessageIdeas';
import DoctorSummary from '../components/DoctorSummary';
import { lateStatus } from '../engine/late';
import { noteSuccess } from '../reviewPrompt';


export default function Home({ premium, onUnlock, onAddPerson, onRestart }: { premium: boolean; onUnlock: () => void; onAddPerson: () => void; onRestart: () => void }) {
  const { periodStarts, flows, moods, settings, setFlow, setMood, mode, name, profiles, activeId, switchProfile } = useStore();
  const partner = mode === 'partner';
  const [selected, setSelected] = useState(todayStr());
  const [month, setMonth] = useState(todayStr());
  const [expanded, setExpanded] = useState(true); // calendar open or minimised (minimised = big Divi)
  const [histOpen, setHistOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const info = cycleInfoFor(selected, periodStarts, settings);
  const fertile = fertileStatus(selected, periodStarts, settings);
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

  // Divi fills the space between the caption row and the buttons, so nothing can overlap her
  const pengSize = Math.max(110, Math.min(box.h - 4, box.w, 420));
  const nextPerson = () => {
    const i = profiles.findIndex((p) => p.id === activeId);
    switchProfile(profiles[(i + 1) % profiles.length].id);
  };

  return (
    <View style={{ flex: 1 }}>
      <ShareScreen visible={shareOpen} who={mode === 'self' ? 'You are' : name} level={face} onClose={() => setShareOpen(false)} />
      <MessageIdeas visible={ideasOpen} phase={(todayInfo ?? info)?.phase ?? 'follicular'} partner={partner} onClose={() => setIdeasOpen(false)} />
      <DoctorSummary visible={docOpen} name={name} starts={periodStarts} flows={flows} settings={settings} onClose={() => setDocOpen(false)} />
      <HistoryCalendar visible={histOpen} starts={periodStarts} flows={flows} settings={settings} onPick={(d) => { setSelected(d); setMonth(d); setExpanded(true); setHistOpen(false); }} onClose={() => setHistOpen(false)} />

      {expanded ? (
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
          <Calendar month={month} onMonth={setMonth} selected={selected} onSelect={setSelected} starts={periodStarts} flows={flows} settings={settings} onCollapse={() => setExpanded(false)} />
          <DayInfo date={selected} starts={periodStarts} settings={settings} partner={partner} />
        </View>
      ) : (
        <View style={s.mini}>
          <Pressable style={s.icon} onPress={() => setExpanded(true)} accessibilityLabel="Open calendar"><Text style={s.iconTxt}>📅</Text></Pressable>
          {profiles.length > 1 && <Pressable style={s.icon} onPress={nextPerson} accessibilityLabel="Switch person"><Text style={s.iconTxt}>👥</Text></Pressable>}
          <Pressable style={s.icon} onPress={onAddPerson} accessibilityLabel="Add person"><Text style={s.iconTxt}>＋</Text></Pressable>
          {late?.late && <Pressable style={[s.icon, { backgroundColor: '#FFE3E0' }]} onPress={() => setDocOpen(true)} accessibilityLabel="Period late"><Text style={s.iconTxt}>⏰</Text></Pressable>}
        </View>
      )}

      <View style={s.bottom}>
        <View style={s.capRow}>
          <Text style={s.caption} numberOfLines={1}>{logged ? `${name} · ${moodName(logged)}` : info ? `${name} · likely ${moodName(face)}` : name}</Text>
          {!expanded && !partner && fertile && (
            <View style={s.riskPill} accessibilityLabel="Fertile window, estimate">
              <Text style={s.riskPillTxt}>Fertile (est.): {fertile.label}</Text>
            </View>
          )}
        </View>

        <View style={s.mid}>
          <Pressable style={s.pengArea} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} onPress={() => { play(face); setPulse((n) => n + 1); }} accessibilityLabel="Tap the penguin">
            {box.h > 0 && <Penguin level={face} size={pengSize} pulse={pulse} />}
          </Pressable>
          {expanded && !partner && fertile && (
            <View style={s.riskChip} accessibilityLabel="Fertile window, estimate">
              <Text style={s.riskTitle}>Fertile window (est.)</Text>
              <Text style={{ fontSize: 14, color: C.ink, fontWeight: '900', marginTop: 6, textAlign: 'center' }}>{fertile.label}</Text>
              {fertile.uncertain && <Text style={{ fontSize: 10, color: C.sub, textAlign: 'center', marginTop: 2 }}>Less certain</Text>}
            </View>
          )}
        </View>

        <View style={s.moodBar} accessibilityLabel="Log mood for the selected day">
          {MOODS.map((m) => {
            const on = logged === m.level;
            return (
              <Pressable key={m.level} disabled={isFuture} accessibilityLabel={`Log mood ${m.name}`} onPress={() => { setMood(selected, on ? null : m.level); if (!on) noteSuccess(4); }} style={[s.moodChip, on && { backgroundColor: m.color, borderColor: m.color }, isFuture && { opacity: 0.4 }]}>
                <Text style={[s.moodTxt, on && { color: '#fff' }]} numberOfLines={1}>{m.short}</Text>
              </Pressable>
            );
          })}
        </View>

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

        <View style={s.actions}>
          <Pressable style={s.act} onPress={() => setHistOpen(true)} accessibilityLabel="Calendar, past months"><Text style={s.actTxt}>📅 Calendar</Text></Pressable>
          <Pressable style={s.act} onPress={() => setShareOpen(true)} accessibilityLabel="Share mood"><Text style={s.actTxt}>📤 Share</Text></Pressable>
          <Pressable style={s.act} onPress={() => setIdeasOpen(true)} accessibilityLabel="Message ideas"><Text style={s.actTxt}>💌 Ideas</Text></Pressable>
          <Pressable style={[s.act, s.actReset]} onPress={onRestart} accessibilityLabel="Reset and start over"><Text style={[s.actTxt, { color: C.period }]}>🔄 Reset</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  who: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: C.pinkSoft },
  whoOn: { backgroundColor: C.pink, borderColor: C.pink },
  whoTxt: { fontSize: 13, fontWeight: '800', color: C.ink },
  top: { paddingHorizontal: 14, paddingTop: 4 },
  mini: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.pinkSoft },
  iconTxt: { fontSize: 17 },
  bottom: { flex: 1, marginTop: 6, backgroundColor: C.pinkSoft, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden', paddingTop: 12, paddingBottom: 8 },
  capRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 8 },
  caption: { flex: 1, fontSize: 15, fontWeight: '900', color: C.ink },
  riskPill: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  riskPillTxt: { fontSize: 12, fontWeight: '900', color: C.sub },
  moodBar: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingBottom: 6 },
  moodChip: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: C.pinkSoft, paddingVertical: 5, alignItems: 'center' },
  moodTxt: { fontSize: 11, fontWeight: '800', color: C.ink },
  mid: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  pengArea: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  riskChip: { backgroundColor: '#fff', borderRadius: 18, padding: 8, alignItems: 'center', width: 138 },
  riskTitle: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase' },
  late: { backgroundColor: '#FFE3E0', borderRadius: 14, paddingVertical: 7, paddingHorizontal: 12, marginBottom: 6 },
  lateTxt: { fontSize: 12, fontWeight: '800', color: '#A3372E' },
  flowBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, marginBottom: 8 },
  flowLabel: { fontSize: 11, fontWeight: '800', color: C.ink },
  flow: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6 },
  flowTxt: { fontSize: 11, fontWeight: '700', color: C.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  act: { backgroundColor: C.pink, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18 },
  actReset: { backgroundColor: '#fff' },
  actTxt: { color: '#fff', fontWeight: '900', fontSize: 12 },
});

