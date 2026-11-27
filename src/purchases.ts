import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// RevenueCat: SDK + RevenueCat's own paywall (react-native-purchases-ui).
// Set EXPO_PUBLIC_RC_IOS_KEY (public SDK key from the RevenueCat dashboard) and create an entitlement
// called "premium". Plans: $2.99/week, $4.99/month, $29.99/year (7-day free trial on each) and $39.99 lifetime
// (non-consumable divi_plus_lifetime, package $rc_lifetime in offering "default"). See PRICING.md.
export const ENTITLEMENT = 'premium';
const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';

let configured = false;
export function initPurchases(): boolean {
  if (Platform.OS === 'web' || configured || !IOS_KEY) return configured;
  try {
    if (__DEV__) Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: IOS_KEY });
    Purchases.enableAdServicesAttributionTokenCollection().catch(() => {}); // Apple Search Ads attribution (no ATT prompt needed)
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export async function isPremium(): Promise<boolean> {
  if (!initPurchases()) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT];
  } catch {
    return false;
  }
}

/** Shows RevenueCat's own paywall. Returns true when the user now has the entitlement. */
export async function showPaywall(): Promise<boolean> {
  if (!initPurchases()) return false;
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: ENTITLEMENT });
    return await isPremium();
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!initPurchases()) return false;
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active[ENTITLEMENT];
  } catch {
    return false;
  }
}

/**
 * How many people the user may track. Apple has no per-quantity subscriptions, so extra people are
 * sold as tiers: create RevenueCat entitlements people_2, people_3, ... and attach one subscription
 * product to each. Slots = 1 (free) or the highest active tier.
 */
export async function getSlots(): Promise<number> {
  if (Platform.OS === 'web') return 99; // web preview: unlimited
  if (!initPurchases()) return 1;
  try {
    const info = await Purchases.getCustomerInfo();
    let slots = 1;
    for (const id of Object.keys(info.entitlements.active)) {
      const m = /^people_(\d+)$/.exec(id);
      if (m) slots = Math.max(slots, Number(m[1]));
    }
    return slots;
  } catch {
    return 1;
  }
}

/** Live entitlement updates (renewal, expiry, refund, purchase on another device). Returns an unsubscribe. */
export function onEntitlementChange(cb: (premium: boolean, slots: number) => void): () => void {
  if (Platform.OS === 'web' || !initPurchases()) return () => {};
  const fn = (info: any) => {
    let slots = 1;
    for (const id of Object.keys(info.entitlements.active)) {
      const m = /^people_(\d+)$/.exec(id);
      if (m) slots = Math.max(slots, Number(m[1]));
    }
    cb(!!info.entitlements.active[ENTITLEMENT], slots);
  };
  Purchases.addCustomerInfoUpdateListener(fn);
  return () => { Purchases.removeCustomerInfoUpdateListener(fn); };
}

/** Non-personal attributes for RevenueCat charts and targeting. Never names or cycle data. */
export function setPurchaseAttributes(a: { people: number; mode: string; alerts: boolean }): void {
  if (Platform.OS === 'web' || !initPurchases()) return;
  Purchases.setAttributes({ people_tracked: String(a.people), first_mode: a.mode, mood_alerts: a.alerts ? 'on' : 'off' }).catch(() => {});
}

/** RevenueCat Customer Center: manage or cancel, restore, refund help. */
export async function openCustomerCenter(): Promise<void> {
  if (!initPurchases()) return;
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    await RevenueCatUI.presentCustomerCenter();
  } catch { /* ignore */ }
}
