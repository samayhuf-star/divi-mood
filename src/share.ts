import { Platform, Share } from 'react-native';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import type { MoodLevel } from './engine/cycle';
import { moodName } from './engine/cycle';

export const APP_LINK = 'https://apps.esamay.live/divimood';

const GIFS: Record<MoodLevel, number> = {
  6: require('../assets/share/mood6.gif'),
  5: require('../assets/share/mood5.gif'),
  4: require('../assets/share/mood4.gif'),
  3: require('../assets/share/mood3.gif'),
  2: require('../assets/share/mood2.gif'),
  1: require('../assets/share/mood1.gif'),
};

export const INVITE_IMG: number = require('../assets/share/invite.png');
export const moodGif = (level: MoodLevel): number => GIFS[level];

export function inviteMessage(): string {
  return `Meet Divi 🐧 the cute penguin that shows today's mood.\nTry Divi Mood: ${APP_LINK}`;
}

const LINES: Record<MoodLevel, string> = {
  6: 'is feeling spicy today',
  5: 'is a Green Signal today',
  4: 'is Safe to Talk today',
  3: 'says Proceed Carefully today',
  2: 'says Danger Ahead today',
  1: 'needs chocolate now',
};

/** Share text. `who` is "You are" for the user's own profile, otherwise the person's name. */
export function shareMessage(who: string, level: MoodLevel): string {
  const self = who === 'You are';
  const line = self ? LINES[level].replace(/^is /, 'am ') : LINES[level];
  return `${self ? 'I' : who} ${line} 🐧 (${moodName(level)})\nTracked with Divi Mood: ${APP_LINK}`;
}

async function shareFile(mod: number, name: string, mime: string, uti: string, message: string): Promise<'shared' | 'dismissed' | 'error'> {
  try {
    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      if (nav?.share) { await nav.share({ title: 'Divi Mood', text: message, url: APP_LINK }); return 'shared'; }
      if (nav?.clipboard) { await nav.clipboard.writeText(message); return 'shared'; }
      return 'error';
    }
    const asset = Asset.fromModule(mod);
    await asset.downloadAsync();
    const src = new File(asset.localUri ?? asset.uri);
    const dest = new File(Paths.cache, name);
    if (dest.exists) dest.delete();
    src.copy(dest);
    if (Platform.OS === 'ios') {
      // iOS share sheet carries both the picture and the text
      const r = await Share.share({ message, url: dest.uri });
      return r.action === Share.dismissedAction ? 'dismissed' : 'shared';
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest.uri, { mimeType: mime, dialogTitle: 'Share', UTI: uti });
      return 'shared';
    }
    await Share.share({ message });
    return 'shared';
  } catch {
    try { await Share.share({ message }); return 'shared'; } catch { return 'error'; }
  }
}

/** System share sheet: anyone, any social app, or a single contact. Carries the animated mood GIF (app link baked in). */
export function shareMood(who: string, level: MoodLevel) {
  return shareFile(GIFS[level], `divi-mood-${level}.gif`, 'image/gif', 'com.compuserve.gif', shareMessage(who, level));
}

/** Invite card for the app itself. */
export function shareInvite() {
  return shareFile(INVITE_IMG, 'divi-mood-invite.png', 'image/png', 'public.png', inviteMessage());
}

export async function copyLink(): Promise<boolean> {
  try { await Clipboard.setStringAsync(APP_LINK); return true; } catch { return false; }
}
