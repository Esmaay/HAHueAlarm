# HAHueAlarm

A dark-themed **Expo (React Native)** alarm app whose alarms wake the *room*, not
just the sleeper: at alarm time the app plays a sound **and** ramps Philips Hue
lights from a warm ember up to daylight through **Home Assistant**.

The design brief, reference teardown, and roadmap live in
[`docs/design-report.html`](docs/design-report.html).

## Commands

```bash
npm start            # Expo dev server (needs a dev client for native modules)
npm run ios          # open on iOS simulator
npm run android      # open on Android
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo export --platform ios --output-dir /tmp/out   # bundle smoke-test
```

Native alarm features (exact scheduling, full-screen intents, looping audio)
require a **development build** — they do not run in Expo Go.

## Architecture

- **`src/app/`** — Expo Router screens. Headers are hidden globally; each screen
  renders its own `<AppBar>`.
  - `index.tsx` — alarm list (home)
  - `alarm/[id].tsx` — create / edit; `alarm/{sound,sunrise,hue}.tsx` — sub-pickers
- **`src/components/ui/`** — the primitive library (`AppText`, `Screen`, `AppBar`,
  `Card`, `Row`, `Button`, `SegmentedControl`, `WeekdayPicker`, …). Import via the
  `@/components/ui` barrel.
- **`src/features/alarms/`** — the alarm domain:
  - `types.ts` — serialisable model (`Alarm`, `SunriseConfig`, `WakeMission`, …)
  - `catalog.ts` — static option lists, factory defaults, label lookups
  - `format.ts` — pure time/schedule helpers (no React, unit-testable)
  - `store.ts` — persisted Zustand store (AsyncStorage), seeds an example on first launch
  - `editorStore.ts` — transient working draft shared across editor sub-screens
  - `notifications.ts` — **Notifee** scheduling: exact AlarmManager triggers with a
    full-screen action + looping sound, one channel per sound; fires over the lock screen
  - `notifeeBackground.ts` — Notifee background event handler (registered at import)
  - `ringController.ts` — the "an alarm is ringing now" store + its side effects
  - `AlarmRuntime.tsx` — headless root runtime: schedule sync, Notifee events, sunrise
  - `sounds.ts` — sound ids (WAVs in `assets/sounds`, copied to res/raw at build)
  - `components/` — alarm-specific views (`AlarmListItem`, `TimePicker`, `SunrisePreview`, …)
- **`src/features/sunrise/`** — `engine.ts`: ramps Hue brightness + colour temp over
  time via the HA client while an alarm rings; graceful fallback if HA is unreachable.
- **`src/features/homeassistant/`** — the Home Assistant connection:
  - `client.ts` — REST calls (test connection, fetch `light.*` entities, `light.turn_on`)
  - `store.ts` — connection config persisted in **expo-secure-store** (the keychain, not
    AsyncStorage — it holds a credential); runtime status + fetched light list
  - Credentials are entered in-app on `app/settings/home-assistant.tsx`, never committed.
- **`src/theme/`** — the single source of design tokens. Dark-only by intent.
- **`plugins/withAlarmAndroid.js`** — config plugin: flags MainActivity
  show-when-locked / turn-screen-on and adds Notifee's maven repo, so the
  full-screen intent can surface the ring screen on a locked phone.

## Conventions

- **Theme, not hex.** Every colour, space, radius, and font size comes from
  `@/theme`. No raw values in component files.
- **`AppText` for all text.** Named `variant`s carry the type scale; don't use
  bare `<Text>` in feature code.
- **Pure helpers stay pure.** Formatting/scheduling logic lives in `format.ts`
  with no state or side effects. Side effects belong in event handlers, not in
  render or `useEffect` state-setters.
- **Path alias:** `@/*` → `src/*`.
- TypeScript is `strict`; keep `npx tsc --noEmit` and `npx expo lint` clean.

## Status

Phases 1–2 complete: design system, alarm list + editor, local persistence,
Home Assistant connection + live light picker, and alarms that **fire** —
scheduled notifications, looping audio with a volume ramp, the full-screen
ringing screen (snooze / hold-to-stop / shake-to-dismiss), and the Hue sunrise
firing on ring.

Firing now goes through **Notifee** — exact AlarmManager triggers with a
full-screen intent + looping sound — so alarms ring and surface the ring screen
**over the lock screen**. The pre-alarm Hue sunrise ramp still runs from a
foreground timer (JS), so it needs the app open; moving the ramp to a Home
Assistant automation is the path to always-on light. Locked-screen firing needs
**on-device verification** (can't be tested from CI).
