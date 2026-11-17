import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOODS, type MoodLevel } from '../engine/cycle';
import { C } from '../theme';
import { useMoodSounds } from '../sound';
import { moodGif, shareMood } from '../share';

/**
 * Shown every time a returning user opens the app: the animated mood card for today's real mood
 * (the mood they logged, or the one expected for their cycle phase). Share it or tap Continue.
 */
export default function LaunchSplash({ level, who, onDone }: { level: MoodLevel; who: string; onDone: () => void }) {
  const [fade] = useState(() => new Animated.Value(0));
  const play = useMoodSounds();
  const done = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 56, (height - 330) * 0.75);
  const cardH = cardW / 0.75;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: false }).start(onDone);
  };
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: false }).start();
    const t1 = setTimeout(() => play(level), 450);
    timer.current = setTimeout(finish, 6000);
    return () => { clearTimeout(t1); if (timer.current) clearTimeout(timer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mood = MOODS.find((m) => m.level === level)!;
  const isSelf = who === 'You are';
  const onShare = () => {
    // Stop the auto-close so the share sheet is not pulled away.
    if (timer.current) clearTimeout(timer.current);
    shareMood(who, level);
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 50 }]}>
      <LinearGradient colors={['#EFF9F9', '#CDEFEE']} style={s.wrap}>
        <Text style={s.brand}>Divi Mood</Text>
        <Text style={s.cap}>
          {isSelf ? 'You are' : `${who} is`} feeling <Text style={{ color: mood.color }}>{mood.name}</Text> today
        </Text>
        <View style={s.cardWrap}>
          <Image source={moodGif(level)} style={{ width: cardW, height: cardH, borderRadius: 32 }} resizeMode="cover" accessibilityLabel={`Today's mood: ${mood.name}`} />
        </View>
        <View style={s.row}>
          <Pressable style={s.share} onPress={onShare} accessibilityLabel="Share mood"><Text style={s.shareTxt}>⇪  Share</Text></Pressable>
          <Pressable style={s.cont} onPress={finish} accessibilityLabel="Continue"><Text style={s.contTxt}>Continue</Text></Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28 },
  brand: { fontSize: 24, fontWeight: '900', color: C.pink, letterSpacing: 0.5 },
  cap: { fontSize: 18, fontWeight: '800', color: C.ink, textAlign: 'center', marginTop: 6 },
  cardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  share: { flex: 1, backgroundColor: '#3B8BFF', borderRadius: 30, height: 56, alignItems: 'center', justifyContent: 'center' },
  shareTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cont: { flex: 1, backgroundColor: C.pink, borderRadius: 30, height: 56, alignItems: 'center', justifyContent: 'center' },
  contTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
