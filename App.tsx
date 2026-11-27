import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import Insights from './src/screens/Insights';
import Settings from './src/screens/Settings';
import { C } from './src/theme';
import PersonForm from './src/components/PersonForm';
import LaunchSplash from './src/components/LaunchSplash';
import { cancelMoodAlerts, syncMoodAlerts, useAlertSetting } from './src/notifications';
import { cycleInfoFor, expectedMood, todayStr, type MoodLevel } from './src/engine/cycle';
import { parseCode } from './src/shareCode';
import { syncWidget } from './src/widgetSync';
import { startsFromFlows } from './src/store';
import { initPush } from './src/push';
import { getSlots, initPurchases, isPremium, onEntitlementChange, restorePurchases, setPurchaseAttributes, showPaywall } from './src/purchases';

type Tab = 'home' | 'insights' | 'settings';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🐧', label: 'Today' },
  { id: 'insights', icon: '📊', label: 'Insights' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function Root() {
  const { ready, onboarded, profiles, addProfile, restartProfile, activeId, name: activeName, mode: activeMode } = useStore();
  const [alertsOn] = useAlertSetting();
  const [splash, setSplash] = useState(true);
  const [adding, setAdding] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [code, setCode] = useState('');
  const [slots, setSlots] = useState(Platform.OS === 'web' ? 99 : 1);
  const [tab, setTab] = useState<Tab>('home');
  // On web there is no RevenueCat: the preview shows all features unlocked.
  const [premium, setPremium] = useState(Platform.OS === 'web');

  useEffect(() => {
    initPurchases();
    initPush();
    if (Platform.OS !== 'web') { isPremium().then(setPremium); getSlots().then(setSlots); }
    return onEntitlementChange((p, n) => { setPremium(p); setSlots(n); });
  }, []);
  useEffect(() => {
    if (onboarded) setPurchaseAttributes({ people: profiles.length, mode: profiles[0]?.mode ?? 'self', alerts: alertsOn });
  }, [onboarded, profiles.length, alertsOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the phone's scheduled mood-change alerts in step with everyone being tracked.
  useEffect(() => {
    if (!ready) return;
    // After "Delete all data" nobody is tracked any more: drop every pending reminder (names, cycle info).
    if (!onboarded) { cancelMoodAlerts(); return; }
    syncMoodAlerts(
      profiles.map((p) => ({ name: p.name, mode: p.mode, starts: startsFromFlows(p.flows), settings: p.settings })),
      alertsOn,
      true,
    );
  }, [ready, onboarded, profiles, alertsOn]);

  useEffect(() => {
    if (!ready || !onboarded) return;
    const a = profiles.find((p) => p.id === activeId) ?? profiles[0];
    if (a) syncWidget({ name: a.name, mode: a.mode, starts: startsFromFlows(a.flows), settings: a.settings });
  }, [ready, onboarded, profiles, activeId]);

  const unlock = async () => { if (await showPaywall()) { setPremium(true); setSlots(await getSlots()); } };
  // Extra people are paid tiers: at the limit, show RevenueCat's paywall instead of the form.
  const addPerson = async () => {
    const n = await getSlots();
    setSlots(n);
    if (profiles.length >= n) { await unlock(); if ((await getSlots()) <= profiles.length) return; }
    setAdding(true);
  };
  const restore = async () => { if (await restorePurchases()) setPremium(true); };

  if (!ready) return <View style={s.center}><ActivityIndicator color={C.pink} /></View>;
  if (!onboarded) return <Onboarding onDone={(wantsPremium) => { if (wantsPremium) unlock(); }} />;

  if (restarting) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, paddingHorizontal: 22, paddingBottom: 16 }}>
          <Pressable onPress={() => setRestarting(false)} style={{ paddingVertical: 10 }}><Text style={{ color: C.pink, fontWeight: '800', fontSize: 16 }}>‹ Cancel</Text></Pressable>
          <Text style={{ fontSize: 28, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Start over</Text>
          <PersonForm key={activeId} mode={activeMode} initialName={activeName} submitLabel="Start over" onSubmit={(p) => { restartProfile(activeId, p); setRestarting(false); setTab('home'); }} />
        </View>
      </SafeAreaView>
    );
  }

  if (adding) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, paddingHorizontal: 22, paddingBottom: 16 }}>
          <Pressable onPress={() => setAdding(false)} style={{ paddingVertical: 10 }}><Text style={{ color: C.pink, fontWeight: '800', fontSize: 16 }}>‹ Cancel</Text></Pressable>
          <Text style={{ fontSize: 28, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Add a person</Text>
          <TextInput value={code} onChangeText={setCode} placeholder="Have a Divi code? Paste it here" autoCapitalize="none" autoCorrect={false} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 12, marginTop: 8, color: C.ink }} />
          {parseCode(code) && (
            <Pressable onPress={() => { const np = parseCode(code); if (np) { addProfile(np); setCode(''); setAdding(false); setTab('home'); } }} style={{ backgroundColor: C.pink, borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Add {parseCode(code)?.name} from code</Text>
            </Pressable>
          )}
          <PersonForm mode="partner" submitLabel="Add and meet their penguin" onSubmit={(p) => { addProfile(p); setAdding(false); setTab('home'); }} />
        </View>
      </SafeAreaView>
    );
  }

  const act = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const info = act ? cycleInfoFor(todayStr(), startsFromFlows(act.flows), act.settings) : null;
  const todayLevel: MoodLevel = act?.moods[todayStr()] ?? (info ? expectedMood(info.phase) : 3);

  return (
    <SafeAreaView style={s.safe}>
      {splash && act && <LaunchSplash level={todayLevel} who={act.mode === 'self' ? 'You are' : act.name} onDone={() => setSplash(false)} />}
      <View style={{ flex: 1 }}>
        {tab === 'home' && <Home premium={premium} onUnlock={unlock} onAddPerson={addPerson} onRestart={() => setRestarting(true)} />}
        {tab === 'insights' && <Insights premium={premium} onUnlock={unlock} />}
        {tab === 'settings' && <Settings premium={premium} onUnlock={unlock} onRestore={restore} onRestart={() => setRestarting(true)} />}
      </View>
      <View style={s.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={s.tab} onPress={() => setTab(t.id)} accessibilityRole="tab">
            <Text style={{ fontSize: 20, opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</Text>
            <Text style={[s.tabTxt, tab === t.id && { color: C.pink }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, paddingBottom: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabTxt: { fontSize: 11, fontWeight: '700', color: C.sub },
});
