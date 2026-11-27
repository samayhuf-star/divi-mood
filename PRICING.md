# Divi Mood pricing

Decided by Samay (17 Nov 2026; updated later the same day to $2.99 / $4.99 / $29.99, all with a 7-day free trial), so no competitor re-pricing was done; first-build price points below.

| Plan | Price | Trial | RevenueCat package |
|---|---|---|---|
| Weekly | $2.99 | 7 days | `$rc_weekly` |
| Monthly | $4.99 | 7 days | `$rc_monthly` |
| Yearly | $29.99 | 7 days | `$rc_annual` |
| Lifetime | $39.99 | none (one-time) | `$rc_lifetime` |

Entitlement: `premium` (mood insights by cycle phase, 7-day forecast). Free: first person, calendar with the fertile window (estimate), flow and mood log, Divi, full history. The pregnancy risk meter was removed on 22 Nov 2026 (App Review guideline 1.4.1).

Extra people (assumption, $1.99/month each, to be confirmed): subscription tiers mapped to entitlements `people_2`, `people_3`, `people_4`, `people_5` (slots = 1 + highest active tier), because Apple has no per-quantity subscriptions.

Offering `default` holds weekly, monthly, yearly, lifetime (lifetime added 27 Nov 2026: ASC `divi_plus_lifetime` non-consumable; attach it to entitlement `premium` and add package `$rc_lifetime` to the RevenueCat paywall in the dashboard). Offering `people` holds the four tier products. Always presented with RevenueCat's own paywall.

## RevenueCat setup (17 Nov 2026)
- Project "Divi Mood", iOS app com.samay.wifeymood, entitlement `premium`.
- Offering `default`: $rc_annual -> divi_plus_yearly, $rc_monthly -> divi_plus_monthly, $rc_weekly -> divi_plus_weekly.
- RevenueCat paywall (teal, Divi penguin) published on `default`; Terms/Privacy point to apps.esamay.live/divimood/terms and /privacy (pages still to be created).
- Prices in the editor preview are placeholders until the App Store Connect products exist.
