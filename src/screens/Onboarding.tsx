import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Penguin from '../components/Penguin';
import PersonForm from '../components/PersonForm';
import { C } from '../theme';
import { useStore, type Mode, type NewPerson } from '../store';

const Btn = ({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) => (
  <Pressable onPress={onPress} style={[s.btn, ghost && s.ghost]} accessibilityRole="button">
    <Text style={[s.btnTxt, ghost && { color: C.sub }]}>{label}</Text>
  </Pressable>
);

export default function Onboarding({ onDone }: { onDone: (wantsPremium: boolean) => void }) {
  const { finishOnboarding, acceptDisclaimer } = useStore();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>('self');
  const [person, setPerson] = useState<NewPerson | null>(null);

  const finish = (premium: boolean) => {
    if (!person) return;
    acceptDisclaimer();
    finishOnboarding(person);
    onDone(premium);
  };

  // Step 0: intro. Step 1: who is this for. Step 2: name + cycle questions. Step 3: what you get.
  if (step === 0) {
    return (
      <View style={s.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Penguin level={5} size={280} />
          <Text style={s.h1}>Meet Divi</Text>
          <Text style={s.body}>A cute penguin that shows how her mood is today, so you know what to expect before you walk in the door.</Text>
        </View>
        <Btn label="Continue" onPress={() => setStep(1)} />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={s.page}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={s.h1}>Who is this for?</Text>
          <Text style={s.body}>Pick one to start. You can add more people later, each with their own penguin.</Text>
          <Pressable style={[s.big, mode === 'self' && s.bigOn]} onPress={() => setMode('self')}>
            <Text style={s.bigTitle}>My own cycle</Text>
            <Text style={s.bigSub}>Log my period, flow and mood. See my fertile days and the pregnancy risk meter.</Text>
          </Pressable>
          <Pressable style={[s.big, mode === 'partner' && s.bigOn]} onPress={() => setMode('partner')}>
            <Text style={s.bigTitle}>Someone I care about</Text>
            <Text style={s.bigSub}>Answer a few questions about her cycle. Her penguin shows her likely mood each day.</Text>
          </Pressable>
        </View>
        <Btn label="Continue" onPress={() => setStep(2)} />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={s.page}>
        <Text style={s.h1}>{mode === 'partner' ? 'A few quick questions' : 'Set up your cycle'}</Text>
        <Text style={[s.body, { marginBottom: 0 }]}>Rough answers are fine. The penguin gets smarter as you log real moods.</Text>
        <PersonForm key={mode} mode={mode} submitLabel="Continue" onSubmit={(p) => { setPerson(p); setStep(3); }} />
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
                ['Divi Plus', 'Pregnancy risk meter, mood insights by cycle phase, 7-day forecast. 7-day free trial.'],
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
              : 'Divi Mood is for general wellness and is not a medical device or a method of birth control. Predictions are estimates and can be wrong. The pregnancy risk meter is not a guarantee of safety. Talk to a doctor for medical advice or reliable contraception.'}
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
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginTop: 10 },
  big: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginTop: 12, borderWidth: 3, borderColor: 'transparent' },
  bigOn: { borderColor: C.pink },
  bigTitle: { fontSize: 19, fontWeight: '900', color: C.ink },
  bigSub: { fontSize: 14, color: C.sub, marginTop: 4, lineHeight: 20 },
});
