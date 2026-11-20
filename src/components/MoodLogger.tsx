import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { MOODS, moodName, type MoodLevel } from '../engine/cycle';

/** Bottom sheet for logging the mood of the selected day (named moods, tap to choose, tap again to clear). */
export default function MoodLogger({ visible, who, date, current, onPick, onClose }: {
  visible: boolean;
  who: string;
  date: string;
  current: MoodLevel | undefined;
  onPick: (m: MoodLevel | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close mood log" />
      <View style={s.sheet}>
        <Text style={s.title}>How is {who} feeling?</Text>
        <Text style={s.sub}>{date}{current ? ` · logged: ${moodName(current)}` : ''}</Text>
        {MOODS.map((m) => {
          const on = current === m.level;
          return (
            <Pressable
              key={m.level}
              onPress={() => { onPick(on ? null : m.level); onClose(); }}
              style={[s.row, { borderColor: m.color }, on && { backgroundColor: m.color }]}
              accessibilityLabel={`Log mood ${m.name}`}
            >
              <View style={[s.dot, { backgroundColor: m.color }]} />
              <Text style={[s.name, on && { color: '#fff' }]}>{m.name}</Text>
              {on && <Text style={[s.name, { color: '#fff' }]}>✓</Text>}
            </Pressable>
          );
        })}
        <Pressable onPress={onClose} style={s.cancel}><Text style={s.cancelTxt}>Cancel</Text></Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 30, gap: 8 },
  title: { fontSize: 18, fontWeight: '900', color: C.ink },
  sub: { fontSize: 12, color: C.sub, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: C.ink },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelTxt: { fontSize: 14, fontWeight: '800', color: C.sub },
});
