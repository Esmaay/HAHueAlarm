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
  - `notifications.ts` — expo-notifications scheduling (per-sound Android channels)
  - `audio.ts` — looping alarm playback with a volume ramp (expo-audio)
  - `ringController.ts` — the "an alarm is ringing now" store + its side effects
  - `AlarmRuntime.tsx` — headless root runtime: schedules, listens, fires on time
  - `sounds.ts` — sound-id → bundled WAV asset map (tones synthesised in build)
  - `components/` — alarm-specific views (`AlarmListItem`, `TimePicker`, `SunrisePreview`, …)
- **`src/features/sunrise/`** — `engine.ts`: ramps Hue brightness + colour temp over
  time via the HA client while an alarm rings; graceful fallback if HA is unreachable.
- **`src/features/homeassistant/`** — the Home Assistant connection:
  - `client.ts` — REST calls (test connection, fetch `light.*` entities, `light.turn_on`)
  - `store.ts` — connection config persisted in **expo-secure-store** (the keychain, not
    AsyncStorage — it holds a credential); runtime status + fetched light list
  - Credentials are entered in-app on `app/settings/home-assistant.tsx`, never committed.
- **`src/theme/`** — the single source of design tokens. Dark-only by intent.

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

Firing is reliable while the app is foregrounded (a precise in-app timer) and
via notifications when backgrounded. **Known gap:** true locked-screen /
app-killed full-screen firing needs Notifee (`AlarmManager` + full-screen
intents) — the next reliability iteration, best done with on-device testing.
