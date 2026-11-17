import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { MoodLevel } from './engine/cycle';

const KEY = 'wifeymood.sound';
let enabled = true;
const listeners = new Set<(v: boolean) => void>();
AsyncStorage.getItem(KEY).then((v) => {
  if (v === '0') { enabled = false; listeners.forEach((l) => l(false)); }
}).catch(() => {});

/** Sound on/off, shared between Home and Settings and remembered on the device. */
export function useSoundSetting(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(enabled);
  useEffect(() => { listeners.add(setOn); return () => { listeners.delete(setOn); }; }, []);
  const set = useCallback((v: boolean) => {
    enabled = v;
    AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
    listeners.forEach((l) => l(v));
  }, []);
  return [on, set];
}

const FILES = {
  1: require('../assets/sounds/mood1.wav'),
  2: require('../assets/sounds/mood2.wav'),
  3: require('../assets/sounds/mood3.wav'),
  4: require('../assets/sounds/mood4.wav'),
  5: require('../assets/sounds/mood5.wav'),
  6: require('../assets/sounds/mood6.wav'),
};

/** Returns play(level): one short original sound per mood. */
export function useMoodSounds() {
  const p1 = useAudioPlayer(FILES[1]);
  const p2 = useAudioPlayer(FILES[2]);
  const p3 = useAudioPlayer(FILES[3]);
  const p4 = useAudioPlayer(FILES[4]);
  const p5 = useAudioPlayer(FILES[5]);
  const p6 = useAudioPlayer(FILES[6]);

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }, []);

  return useCallback((level: MoodLevel) => {
    if (!enabled) return;
    const p = { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6 }[level];
    try {
      p.seekTo(0);
      p.play();
    } catch {
      /* a failed sound must never break the screen */
    }
  }, [p1, p2, p3, p4, p5, p6]);
}
