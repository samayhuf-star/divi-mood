// OneSignal remote push for optional "Tips and news". Mood alerts stay local (expo-notifications).
// Consent is required before OneSignal sends or collects anything: the user opts in during
// onboarding or in Settings; the choice is remembered on the device. Default: off.
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '';
const KEY = 'wifeymood.pushTips';
let consent = false;
let started = false;
const listeners = new Set<(v: boolean) => void>();

function apply(v: boolean) {
  if (Platform.OS === 'web' || !APP_ID) return;
  try {
    if (!started) { OneSignal.setConsentRequired(true); OneSignal.initialize(APP_ID); started = true; }
    OneSignal.setConsentGiven(v);
    if (v) OneSignal.Notifications.requestPermission(false).catch(() => {});
  } catch { /* push is optional */ }
}

/** Call once at launch: starts OneSignal in consent-required mode with the saved choice. */
export function initPush(): void {
  AsyncStorage.getItem(KEY)
    .then((v) => { consent = v === '1'; listeners.forEach((l) => l(consent)); apply(consent); })
    .catch(() => apply(false));
}

export function setPushConsent(v: boolean): void {
  consent = v;
  AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
  listeners.forEach((l) => l(v));
  apply(v);
}

/** Tips and news push on/off (OneSignal consent). */
export function usePushConsent(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(consent);
  useEffect(() => { listeners.add(setOn); return () => { listeners.delete(setOn); }; }, []);
  const set = useCallback((v: boolean) => setPushConsent(v), []);
  return [on, set];
}
