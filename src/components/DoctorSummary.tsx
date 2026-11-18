import React from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C } from '../theme';
import { todayStr, type CycleSettings, type DateStr } from '../engine/cycle';
import { doctorSummary } from '../engine/late';

/** Simple cycle summary to show or send to a doctor. */
export default function DoctorSummary({ visible, name, starts, flows, settings, onClose }: { visible: boolean; name: string; starts: DateStr[]; flows: Record<DateStr, string>; settings: CycleSettings; onClose: () => void }) {
  const text = doctorSummary({ name, starts, flows, settings }, todayStr());
  const send = () => { Share.share({ message: text }).catch(() => { Clipboard.setStringAsync(text).catch(() => {}); }); };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.back}>
        <View style={s.sheet}>
          <Text style={s.h}>🩺 Doctor summary</Text>
          <ScrollView style={s.box}><Text style={s.txt} selectable>{text}</Text></ScrollView>
          <Pressable style={s.cta} onPress={send} accessibilityLabel="Share summary"><Text style={s.ctaTxt}>Share summary</Text></Pressable>
          <Pressable style={s.close} onPress={onClose}><Text style={s.closeTxt}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 30 },
  h: { fontSize: 20, fontWeight: '900', color: C.ink, marginBottom: 8 },
  box: { maxHeight: 340, backgroundColor: C.pinkSoft, borderRadius: 16, padding: 12 },
  txt: { fontSize: 13, color: C.ink, lineHeight: 19 },
  cta: { backgroundColor: C.pink, borderRadius: 22, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  close: { alignItems: 'center', paddingVertical: 10 },
  closeTxt: { color: C.pink, fontWeight: '800', fontSize: 15 },
});
