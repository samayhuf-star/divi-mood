import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { C } from '../theme';
import { INVITE_IMG, copyLink, moodGif, shareInvite, shareMood, APP_LINK } from '../share';
import type { MoodLevel } from '../engine/cycle';

type Tab = 'mood' | 'invite';

/** Full-screen share card: preview + one big Share button (anyone, social apps, or one contact via the system sheet). */
export default function ShareScreen({ visible, who, level, onClose }: { visible: boolean; who: string; level: MoodLevel; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('mood');
  const [copied, setCopied] = useState(false);
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 56, (height - 330) * 0.75);
  const cardH = cardW / 0.75;

  const onShare = () => (tab === 'mood' ? shareMood(who, level) : shareInvite());
  const onCopy = async () => {
    const ok = await copyLink();
    setCopied(ok);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={s.top}>
          <Pressable style={s.round} onPress={onClose} accessibilityLabel="Close"><Text style={s.icon}>‹</Text></Pressable>
          <View style={s.pill}>
            <Pressable onPress={onCopy} accessibilityLabel="Copy app link" hitSlop={8}><Text style={s.pillTxt}>{copied ? '✓ Copied' : '🔗'}</Text></Pressable>
            <Pressable onPress={() => Alert.alert('Share', `The picture carries a small link to Divi Mood (${APP_LINK}). Your cycle details are never included.`)} accessibilityLabel="About sharing" hitSlop={8}><Text style={s.pillTxt}>ⓘ</Text></Pressable>
          </View>
        </View>

        <View style={s.tabs}>
          {(['mood', 'invite'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]} accessibilityLabel={t === 'mood' ? 'Share my mood' : 'Invite a friend'}>
              <Text style={[s.tabTxt, tab === t && { color: '#fff' }]}>{t === 'mood' ? 'Today’s mood' : 'Invite a friend'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.cardWrap}>
          <Image source={tab === 'mood' ? moodGif(level) : INVITE_IMG} style={{ width: cardW, height: cardH, borderRadius: 32 }} resizeMode="cover" />
        </View>

        <Pressable style={s.share} onPress={onShare} accessibilityLabel="Share">
          <Text style={s.shareTxt}>⇪  Share</Text>
        </Pressable>
        <Text style={s.hint}>Send to anyone, post to social media, or message one person.</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F4F8', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 30, color: C.ink, marginTop: -4 },
  pill: { flexDirection: 'row', gap: 22, backgroundColor: '#fff', borderRadius: 24, height: 48, paddingHorizontal: 20, alignItems: 'center' },
  pillTxt: { fontSize: 20, color: C.ink, fontWeight: '700' },
  tabs: { flexDirection: 'row', alignSelf: 'center', gap: 8, marginTop: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff' },
  tabOn: { backgroundColor: C.pink },
  tabTxt: { fontWeight: '800', fontSize: 14, color: C.ink },
  cardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  share: { backgroundColor: '#3B8BFF', borderRadius: 30, height: 58, alignItems: 'center', justifyContent: 'center' },
  shareTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hint: { textAlign: 'center', color: C.sub, fontSize: 13, marginTop: 10 },
});
