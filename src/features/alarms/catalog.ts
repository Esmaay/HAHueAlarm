/**
 * Static option catalogs and factory defaults for alarms.
 *
 * Kept apart from `types.ts` so the pure type layer has no runtime data, and
 * apart from the store so screens can render pickers without importing state.
 */

import { sunriseStops } from '@/theme';

import type {
  Alarm,
  AlarmDraft,
  PostDismissAction,
  SunriseDuration,
  SunriseStyle,
  WakeMission,
} from './types';

export interface SoundOption {
  id: string;
  label: string;
}

/** Bundled alarm tones. `id`s map to files added in Phase 2. */
export const SOUND_OPTIONS: readonly SoundOption[] = [
  { id: 'birdsong', label: 'Birdsong' },
  { id: 'radar', label: 'Radar' },
  { id: 'chimes', label: 'Chimes' },
  { id: 'sunrise_tone', label: 'Sunrise' },
  { id: 'classic_bell', label: 'Classic Bell' },
] as const;

export interface SunriseStyleOption {
  id: SunriseStyle;
  label: string;
  description: string;
  /** Colour-temperature endpoints (Kelvin) for the ramp. */
  fromKelvin: number;
  toKelvin: number;
  /** Preview gradient stops, warm-dim → bright. */
  gradient: readonly string[];
}

export const SUNRISE_STYLES: readonly SunriseStyleOption[] = [
  {
    id: 'warm',
    label: 'Warm wake',
    description: 'Gentle, tops out at a warm amber glow.',
    fromKelvin: 1800,
    toKelvin: 3000,
    gradient: ['#160C05', '#3A160A', '#8F2F16', '#E0662A', '#FFB45A'],
  },
  {
    id: 'natural',
    label: 'Natural',
    description: 'A true sunrise, ember through to daylight.',
    fromKelvin: 1800,
    toKelvin: 4500,
    gradient: sunriseStops,
  },
  {
    id: 'energize',
    label: 'Energize',
    description: 'Fast and bright, finishing cool and crisp.',
    fromKelvin: 2200,
    toKelvin: 5000,
    gradient: ['#3A160A', '#B5502A', '#E0662A', '#FFB45A', '#FFF7EA'],
  },
] as const;

export interface PostDismissOption {
  id: PostDismissAction;
  label: string;
}

export const POST_DISMISS_OPTIONS: readonly PostDismissOption[] = [
  { id: 'hold', label: 'Hold daylight' },
  { id: 'off', label: 'Turn off' },
  { id: 'scene', label: 'Run a scene' },
] as const;

export const SUNRISE_DURATION_OPTIONS: readonly SunriseDuration[] = [10, 20, 30, 45];

export const DEFAULT_SNOOZE_MINUTES = 9;
export const DEFAULT_SHAKE_COUNT = 15;

export const DEFAULT_MISSION: WakeMission = {
  type: 'none',
  shakeCount: DEFAULT_SHAKE_COUNT,
};

export function soundLabel(id: string): string {
  return SOUND_OPTIONS.find((option) => option.id === id)?.label ?? 'Sound';
}

export function sunriseStyleOption(style: SunriseStyle): SunriseStyleOption {
  return SUNRISE_STYLES.find((option) => option.id === style) ?? SUNRISE_STYLES[0];
}

export function postDismissLabel(action: PostDismissAction): string {
  return POST_DISMISS_OPTIONS.find((option) => option.id === action)?.label ?? '';
}

/** A fresh alarm draft: 7:00 AM, weekdays, warm sunrise, sound-only-safe. */
export function createAlarmDraft(): AlarmDraft {
  return {
    hour: 7,
    minute: 0,
    enabled: true,
    label: '',
    repeatDays: [1, 2, 3, 4, 5],
    soundId: SOUND_OPTIONS[0].id,
    snoozeMinutes: DEFAULT_SNOOZE_MINUTES,
    sunrise: {
      enabled: true,
      durationMin: 20,
      style: 'warm',
      targetEntityIds: [],
      targetLabel: 'Not set',
      postDismiss: 'hold',
    },
    mission: { ...DEFAULT_MISSION },
  };
}

/**
 * Strip store-managed fields (id, timestamps) to get an editable draft from a
 * saved alarm. Written out explicitly so the `AlarmDraft` type flags any new
 * field that must be carried into the editor.
 */
export function alarmToDraft(alarm: Alarm): AlarmDraft {
  return {
    hour: alarm.hour,
    minute: alarm.minute,
    enabled: alarm.enabled,
    label: alarm.label,
    repeatDays: alarm.repeatDays,
    soundId: alarm.soundId,
    snoozeMinutes: alarm.snoozeMinutes,
    sunrise: alarm.sunrise,
    mission: alarm.mission,
  };
}

/** The example alarm seeded on first launch to demonstrate the Hue feature. */
export function createSeedAlarmDraft(): AlarmDraft {
  const draft = createAlarmDraft();

  return {
    ...draft,
    hour: 6,
    minute: 30,
    label: 'Good morning',
    sunrise: {
      ...draft.sunrise,
      targetLabel: 'Bedroom',
    },
  };
}
