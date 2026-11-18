import React from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C } from '../theme';
import { messageIdeas } from '../engine/messages';
import type { Phase } from '../engine/cycle';

/** One-tap message ideas for today's phase: tap a card to send it with any app, or copy it. */
export default function MessageIdeas({ visible, phase, partner, onClose }: { visible: boolean; phase: Phase; partner: boolean; onClose: () => void }) {
  const send = (message: string) => {
    Share.share({ message }).catch(() => { Clipboard.setStringAsync(message).catch(() => {}); });
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.back}>
        <View style={s.sheet}>
          <Text style={s.h}>{partner ? '💌 Send her something sweet' : '💌 Tell him what you need'}</Text>
          <Text style={s.sub}>Ideas picked for today. Tap one to send it.</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {messageIdeas(phase, partner).map((m) => (
              <Pressable key={m} style={s.card} onPress={() => send(m)} accessibilityLabel="Send this message">
                <Text style={s.msg}>{m}</Text>
                <Pressable onPress={() => Clipboard.setStringAsync(m).catch(() => {})} hitSlop={8} accessibilityLabel="Copy message"><Text style={s.copy}>Copy</Text></Pressable>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={s.close} onPress={onClose}><Text style={s.closeTxt}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 30 },
  h: { fontSize: 20, fontWeight: '900', color: C.ink },
  sub: { fontSize: 13, color: C.sub, marginBottom: 10, marginTop: 2 },
  card: { backgroundColor: C.pinkSoft, borderRadius: 16, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  msg: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20 },
  copy: { fontSize: 12, fontWeight: '800', color: C.pink },
  close: { marginTop: 6, alignItems: 'center', paddingVertical: 10 },
  closeTxt: { color: C.pink, fontWeight: '800', fontSize: 15 },
});
