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
  - `components/` — alarm-specific views (`AlarmListItem`, `TimePicker`, `SunrisePreview`, …)
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

Phase 1 (design system + alarm list + editor + local persistence) is complete.
Next: Phase 2 — reliable scheduled alarms, looping audio, and the ringing screen.
