import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { planMoodAlerts, type AlertPerson } from './engine/alerts';
import { parse } from './engine/cycle';

const KEY = 'wifeymood.alerts';
let enabled = true;
const listeners = new Set<(v: boolean) => void>();
AsyncStorage.getItem(KEY).then((v) => { if (v === '0') { enabled = false; listeners.forEach((l) => l(false)); } }).catch(() => {});

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Mood-change alerts on/off, remembered on the device. */
export function useAlertSetting(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(enabled);
  useEffect(() => { listeners.add(setOn); return () => { listeners.delete(setOn); }; }, []);
  const set = useCallback((v: boolean) => {
    enabled = v;
    AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
    listeners.forEach((l) => l(v));
  }, []);
  return [on, set];
}

async function allowed(ask: boolean): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!ask || !cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces all pending mood alerts with the next ones for everyone being tracked (8:00 local time). */
export async function syncMoodAlerts(people: AlertPerson[], on: boolean, ask = false): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!on || !(await allowed(ask))) return;
    for (const a of planMoodAlerts(people)) {
      const d = parse(a.date);
      d.setHours(8, 0, 0, 0);
      if (d.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: a.title, body: a.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d },
      });
    }
  } catch { /* notifications are best-effort; never crash the app */ }
}
