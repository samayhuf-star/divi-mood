import React, { useState } from 'react';
import { Alert, Linking, Share, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { useStore } from '../store';
import { useSoundSetting } from '../sound';
import { useAlertSetting } from '../notifications';
import { makeCode } from '../shareCode';
import { startsFromFlows } from '../store';
import { openCustomerCenter } from '../purchases';
import DoctorSummary from '../components/DoctorSummary';

export default function Settings({ premium, onUnlock, onRestore, onRestart }: { premium: boolean; onUnlock: () => void; onRestore: () => void; onRestart: () => void }) {
  const { settings, setSettings, wipe, profiles, activeId, removeProfile, name, flows } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [soundOn, setSoundOn] = useSoundSetting();
  const [alertsOn, setAlertsOn] = useAlertSetting();

  const shareCycle = () => {
    const starts = startsFromFlows(flows);
    const last = starts[starts.length - 1];
    if (!last) { Alert.alert('Nothing to share yet', 'Log a period first.'); return; }
    const code = makeCode({ name, lastPeriod: last, cycleLength: settings.cycleLength, periodLength: settings.periodLength });
    Share.share({ message: `Follow my mood with Divi Mood 🐧. In the app tap Add a person, then paste this code:\n${code}` }).catch(() => {});
  };

  const del = () => {
    if (Platform.OS === 'web') { setConfirm(true); return; }
    Alert.alert('Delete all data?', 'This removes every log from this phone and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: wipe },
    ]);
  };

  const Step = ({ label, v, min, max, k }: { label: string; v: number; min: number; max: number; k: 'cycleLength' | 'periodLength' }) => (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable style={s.b} onPress={() => setSettings({ [k]: Math.max(min, v - 1) })}><Text style={s.bt}>−</Text></Pressable>
        <Text style={s.val}>{v}</Text>
        <Pressable style={s.b} onPress={() => setSettings({ [k]: Math.min(max, v + 1) })}><Text style={s.bt}>+</Text></Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.h}>Settings</Text>
      <View style={s.card}>
        <Text style={s.title}>People ({profiles.length})</Text>
        {profiles.map((p) => (
          <View key={p.id} style={s.row}>
            <Text style={s.lbl}>🐧 {p.name}{p.id === activeId ? '  (showing)' : ''}</Text>
            {profiles.length > 1 && <Pressable onPress={() => removeProfile(p.id)}><Text style={[s.link, { color: '#D6453A' }]}>Remove</Text></Pressable>}
          </View>
        ))}
        <Text style={s.small}>Each person has their own penguin and settings. Extra people are a monthly add-on.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>{name}'s cycle</Text>
        <Step label="Typical cycle length" v={settings.cycleLength} min={21} max={45} k="cycleLength" />
        <Step label="Typical period length" v={settings.periodLength} min={2} max={10} k="periodLength" />
        <Text style={s.small}>Once you log real periods, Divi Mood uses your own average instead.</Text>
        <Pressable onPress={onRestart} accessibilityLabel="Start over with a new date" style={s.restart}>
          <Text style={s.restartTxt}>🔄 Start over with a new date</Text>
        </Pressable>
        <Text style={s.small}>Pick a different last period date and cycle for {name}. This clears {name}'s logged dates and moods.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Doctor summary</Text>
        <Pressable onPress={() => setDocOpen(true)} accessibilityLabel="Open doctor summary" style={s.restart}>
          <Text style={s.restartTxt}>🩺 View cycle summary</Text>
        </Pressable>
        <Text style={s.small}>Average cycle, recent periods and any lateness in one note to show or send a doctor. You also get a nudge when a period is more than 2 days late.</Text>
      </View>
      <DoctorSummary visible={docOpen} name={name} starts={startsFromFlows(flows)} flows={flows} settings={settings} onClose={() => setDocOpen(false)} />

      <View style={s.card}>
        <Text style={s.title}>Share with your partner</Text>
        <Pressable onPress={shareCycle} accessibilityLabel="Share my cycle code" style={s.restart}>
          <Text style={s.restartTxt}>💌 Send {name}'s code</Text>
        </Pressable>
        <Text style={s.small}>Sends a short code with the last period date and cycle length only, using the share sheet you choose. Nothing is uploaded; they paste it under Add a person.</Text>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.lbl}>Penguin sounds</Text>
          <Pressable onPress={() => setSoundOn(!soundOn)} style={[s.b, { width: 70, borderRadius: 17 }, soundOn && { backgroundColor: C.pink }]}>
            <Text style={{ fontWeight: '800', color: soundOn ? '#fff' : C.pink }}>{soundOn ? 'On' : 'Off'}</Text>
          </Pressable>
        </View>
        <View style={s.row}>
          <Text style={s.lbl}>Daily mood alerts (2 pm)</Text>
          <Pressable onPress={() => setAlertsOn(!alertsOn)} style={[s.b, { width: 70, borderRadius: 17 }, alertsOn && { backgroundColor: C.pink }]}>
            <Text style={{ fontWeight: '800', color: alertsOn ? '#fff' : C.pink }}>{alertsOn ? 'On' : 'Off'}</Text>
          </Pressable>
        </View>
        <Text style={s.small}>A daily notification at 2 pm with the expected mood, plus an evening heads-up before low-mood days, for everyone you track. Turn off any time.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Divi Plus {premium ? '✓' : ''}</Text>
        {!premium && <Pressable style={s.cta} onPress={onUnlock}><Text style={s.ctaTxt}>Try free for 7 days</Text></Pressable>}
        <Pressable onPress={onRestore} style={{ paddingVertical: 10 }}><Text style={s.link}>Restore purchases</Text></Pressable>
        {Platform.OS !== 'web' && <Pressable onPress={openCustomerCenter} style={{ paddingVertical: 10 }}><Text style={s.link}>Manage subscription</Text></Pressable>}
      </View>

      <View style={s.card}>
        <Text style={s.title}>Your privacy</Text>
        <Text style={s.small}>All logs are stored only on this phone. No account, no ads, no tracking of your cycle data. Nothing is sold or shared.</Text>
        <Pressable onPress={() => Linking.openURL('https://media.base44.com/files/public/6af96a57b5faa95de96aa132/80e142f5b_divimood-privacy.txt')} style={{ paddingVertical: 8 }}><Text style={s.link}>Privacy policy</Text></Pressable>
        <Pressable onPress={() => Linking.openURL('https://media.base44.com/files/public/6af96a57b5faa95de96aa132/d75a2de44_divimood-terms.txt')} style={{ paddingVertical: 8 }}><Text style={s.link}>Terms of use</Text></Pressable>
        <Pressable onPress={() => Linking.openURL('mailto:samayhuf@gmail.com')} style={{ paddingVertical: 8 }}><Text style={s.link}>Contact support</Text></Pressable>
        {confirm ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <Pressable onPress={() => { wipe(); setConfirm(false); }}><Text style={[s.link, { color: '#D6335A' }]}>Yes, delete everything</Text></Pressable>
            <Pressable onPress={() => setConfirm(false)}><Text style={s.link}>Cancel</Text></Pressable>
          </View>
        ) : (
          <Pressable onPress={del} style={{ paddingVertical: 8 }}><Text style={[s.link, { color: '#D6335A' }]}>Delete all my data</Text></Pressable>
        )}
      </View>

      <View style={[s.card, { backgroundColor: '#FFF0D6' }]}>
        <Text style={s.title}>Medical disclaimer</Text>
        <Text style={s.small}>
          Divi Mood is for general wellness tracking only. It is not a medical device, does not diagnose, treat or prevent any condition, and is not a method of contraception. Predictions and the pregnancy risk meter are estimates based on a calendar method and can be wrong, especially with irregular cycles. Always check with a doctor before making medical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  restart: { marginTop: 10, borderRadius: 14, borderWidth: 2, borderColor: C.pink, paddingVertical: 10, alignItems: 'center' },
  restartTxt: { color: C.pink, fontWeight: '800', fontSize: 15 },
  h: { fontSize: 28, fontWeight: '900', color: C.ink, marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  lbl: { color: C.ink, fontWeight: '600', fontSize: 15 },
  b: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  bt: { fontSize: 20, color: C.pink, fontWeight: '800', marginTop: -2 },
  val: { fontSize: 17, fontWeight: '800', color: C.ink, minWidth: 26, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 6 },
  small: { fontSize: 13, color: C.sub, lineHeight: 19 },
  link: { color: C.pink, fontWeight: '700', fontSize: 15 },
  modeBtn: { flex: 1, paddingVertical: 11, borderRadius: 16, borderWidth: 2, borderColor: C.pinkSoft, alignItems: 'center', backgroundColor: '#fff' },
  cta: { backgroundColor: C.pink, borderRadius: 22, paddingVertical: 12, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
