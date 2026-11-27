import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Penguin from '../components/Penguin';
import PersonForm from '../components/PersonForm';
import { C } from '../theme';
import { useStore, type Mode, type NewPerson } from '../store';
import { useAlertSetting } from '../notifications';
import { usePushConsent } from '../push';

/** Read by the autopilot panel: 6 intro slides + who + setup + notifications + what you get. */
export const ONBOARDING_SCREENS = 10;

const Btn = ({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) => (
  <Pressable onPress={onPress} style={[s.btn, ghost && s.ghost]} accessibilityRole="button">
    <Text style={[s.btnTxt, ghost && { color: C.sub }]}>{label}</Text>
  </Pressable>
);

const Toggle = ({ title, sub, on, set }: { title: string; sub: string; on: boolean; set: (v: boolean) => void }) => (
  <Pressable style={[s.big, on && s.bigOn]} onPress={() => set(!on)} accessibilityRole="switch" accessibilityState={{ checked: on }}>
    <Text style={s.bigTitle}>{on ? '✓ ' : ''}{title}</Text>
    <Text style={s.bigSub}>{sub}</Text>
  </Pressable>
);

const SLIDES: { level: 1 | 2 | 3 | 4 | 5 | 6; title: string; body: string; size?: number }[] = [
  { level: 5, title: 'Meet Divi', body: 'A cute penguin that shows how her mood is today, so you know what to expect before you walk in the door.' },
  { level: 6, title: 'Six moods, one penguin', body: 'From Feeling Spicy to Bring Chocolate Now. Divi dances, wiggles and changes face with every mood.' },
  { level: 1, title: 'Never get caught off guard', body: 'Get a friendly heads-up the evening before a tough day, and a 7-day mood forecast with simple tips.' },
  { level: 3, title: 'Log in two taps', body: 'Tap a mood, mark a period day. Divi learns the real pattern and the forecast gets better every week.' },
  { level: 2, title: 'Mood at a glance', body: 'Add the Divi widget to your Home or Lock Screen and see today\'s mood without opening the app.' },
  { level: 4, title: 'Share it, privately', body: 'Send a fun Divi mood card to friends. Your data stays on your phone: no account, no server.' },
];

export default function Onboarding({ onDone }: { onDone: (wantsPremium: boolean) => void }) {
  const { finishOnboarding, acceptDisclaimer } = useStore();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>('self');
  const [person, setPerson] = useState<NewPerson | null>(null);
  const [alertsOn, setAlertsOn] = useAlertSetting();
  const [tipsOn, setTipsOn] = usePushConsent();

  const finish = (premium: boolean) => {
    if (!person) return;
    acceptDisclaimer();
    finishOnboarding(person);
    onDone(premium);
  };

  // Steps 0-5: intro slides. 6: who is this for. 7: name + cycle questions. 8: notifications. 9: what you get.
  if (step < SLIDES.length) {
    const sl = SLIDES[step];
    return (
      <View style={s.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Penguin level={sl.level} size={sl.size ?? 260} />
          <Text style={s.h1}>{sl.title}</Text>
          <Text style={s.body}>{sl.body}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {SLIDES.map((_, i) => <View key={i} style={[s.dot, i === step && s.dotOn]} />)}
          </View>
        </View>
        <Btn label="Continue" onPress={() => setStep(step + 1)} />
        {step > 0 && <Btn label="Back" ghost onPress={() => setStep(step - 1)} />}
      </View>
    );
  }

  if (step === SLIDES.length) {
    return (
      <View style={s.page}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={s.h1}>Who is this for?</Text>
          <Text style={s.body}>Pick one to start. You can add more people later, each with their own penguin.</Text>
          <Pressable style={[s.big, mode === 'self' && s.bigOn]} onPress={() => setMode('self')}>
            <Text style={s.bigTitle}>My own cycle</Text>
            <Text style={s.bigSub}>Log my period, flow and mood. See my estimated fertile window.</Text>
          </Pressable>
          <Pressable style={[s.big, mode === 'partner' && s.bigOn]} onPress={() => setMode('partner')}>
            <Text style={s.bigTitle}>Someone I care about</Text>
            <Text style={s.bigSub}>Answer a few questions about her cycle. Her penguin shows her likely mood each day.</Text>
          </Pressable>
        </View>
        <Btn label="Continue" onPress={() => setStep(SLIDES.length + 1)} />
      </View>
    );
  }

  if (step === SLIDES.length + 1) {
    return (
      <View style={s.page}>
        <Text style={s.h1}>{mode === 'partner' ? 'A few quick questions' : 'Set up your cycle'}</Text>
        <Text style={[s.body, { marginBottom: 0 }]}>Rough answers are fine. The penguin gets smarter as you log real moods.</Text>
        <PersonForm key={mode} mode={mode} submitLabel="Continue" onSubmit={(p) => { setPerson(p); setStep(SLIDES.length + 2); }} />
      </View>
    );
  }

  if (step === SLIDES.length + 2) {
    return (
      <View style={s.page}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Penguin level={1} size={160} />
          <Text style={s.h1}>Stay in the loop</Text>
          <Text style={s.body}>Choose what Divi may send you. Change it any time in Settings.</Text>
          <Toggle title="Daily mood alerts" sub="2 pm mood update and an evening heads-up before tough days. Made on your phone." on={alertsOn} set={setAlertsOn} />
          <Toggle title="Tips and news" sub="Occasional cycle tips and new Divi features, sent by push. Off unless you turn it on." on={tipsOn} set={setTipsOn} />
        </View>
        <Btn label="Continue" onPress={() => setStep(SLIDES.length + 3)} />
      </View>
    );
  }

  const partner = mode === 'partner';
  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={{ paddingTop: 24 }}>
        <Text style={s.h1}>What you get</Text>
        <View style={s.card}>
          {(partner
            ? [
                ['Free forever', "Today's mood forecast from the penguin, the cycle calendar, and logging how she really felt."],
                ['Divi Plus', 'A 7-day mood forecast with simple tips for each day. 7-day free trial.'],
                ['More people', 'Add more people, each with their own named penguin. Each extra person is a small monthly add-on.'],
              ]
            : [
                ['Free forever', 'Calendar, period + flow log, mood levels, Divi, full history. No paywall on the basics.'],
                ['Divi Plus', 'Mood insights by cycle phase and a 7-day mood forecast. 7-day free trial.'],
                ['More people', 'Add more people, each with their own named penguin. Each extra person is a small monthly add-on.'],
              ]
          ).map(([t, b]) => (
            <View key={t} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', color: C.ink, fontSize: 16 }}>{t}</Text>
              <Text style={{ color: C.sub, marginTop: 2 }}>{b}</Text>
            </View>
          ))}
        </View>
        <View style={[s.card, { backgroundColor: '#FFF3DC' }]}>
          <Text style={{ fontWeight: '800', color: C.ink }}>Good to know</Text>
          <Text style={{ color: C.ink, marginTop: 4, lineHeight: 20 }}>
            {partner
              ? 'Mood forecasts are a light-hearted guess based on what you entered. Moods vary from day to day and person to person, and she is the real expert on how she feels. Not medical advice.'
              : 'Divi Mood is for general wellness and is not a medical device or a method of birth control. Predictions are estimates and can be wrong. Fertile-window dates are calendar estimates, not a guarantee. Talk to a doctor for medical advice or reliable contraception.'}
          </Text>
        </View>
      </ScrollView>
      <Btn label="Try Divi Plus free for 7 days" onPress={() => finish(true)} />
      <Btn label="Continue with free version" ghost onPress={() => finish(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 22, paddingBottom: 24, paddingTop: 50 },
  h1: { fontSize: 30, fontWeight: '900', color: C.ink, textAlign: 'center' },
  body: { fontSize: 16, color: C.sub, textAlign: 'center', marginTop: 10, lineHeight: 23, paddingHorizontal: 8, marginBottom: 14 },
  btn: { backgroundColor: C.pink, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  ghost: { backgroundColor: 'transparent' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  dotOn: { backgroundColor: C.pink, width: 22 },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginTop: 10 },
  big: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginTop: 12, borderWidth: 3, borderColor: 'transparent' },
  bigOn: { borderColor: C.pink },
  bigTitle: { fontSize: 19, fontWeight: '900', color: C.ink },
  bigSub: { fontSize: 14, color: C.sub, marginTop: 4, lineHeight: 20 },
});
