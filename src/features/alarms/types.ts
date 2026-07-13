/**
 * Domain model for alarms.
 *
 * An alarm owns two outputs — sound and light — that fire together. The light
 * side (`sunrise`) maps onto a Home Assistant / Hue transition; the sound side
 * plays locally. Everything here is serialisable so it can be persisted as JSON.
 */

/** 0 = Sunday … 6 = Saturday, matching JavaScript's `Date.getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Ordered Monday-first for display; storage/logic stays Sunday-indexed. */
export const WEEKDAYS_DISPLAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** How the physical light behaves as it ramps up. */
export type SunriseStyle = 'warm' | 'natural' | 'energize';

/** Duration of the pre-alarm light ramp, in minutes. */
export type SunriseDuration = 10 | 20 | 30 | 45;

export const SUNRISE_DURATIONS: readonly SunriseDuration[] = [10, 20, 30, 45];

/** What the room does once the alarm is dismissed. */
export type PostDismissAction = 'hold' | 'off' | 'scene';

export interface SunriseConfig {
  /** When false, the alarm is sound-only and no Hue call is made. */
  enabled: boolean;
  /** Minutes before alarm time that the ramp begins. */
  durationMin: SunriseDuration;
  style: SunriseStyle;
  /** Home Assistant entity ids to drive, e.g. `light.bedroom`. */
  targetEntityIds: string[];
  /** Human label for the target group, shown on rows without a lookup. */
  targetLabel: string;
  postDismiss: PostDismissAction;
  /** Scene entity to run when `postDismiss` is `scene`. */
  postDismissSceneId?: string;
}

/** The anti-oversleep gate shown on the ringing screen. */
export interface WakeMission {
  type: 'none' | 'shake';
  /** Shakes required to dismiss when `type` is `shake`. */
  shakeCount: number;
}

export interface Alarm {
  id: string;
  /** Local wall-clock hour, 0–23. */
  hour: number;
  /** Local wall-clock minute, 0–59. */
  minute: number;
  enabled: boolean;
  label: string;
  /** Empty array means "does not repeat" (a one-shot alarm). */
  repeatDays: Weekday[];
  soundId: string;
  snoozeMinutes: number;
  sunrise: SunriseConfig;
  mission: WakeMission;
  createdAt: number;
  updatedAt: number;
}

/** Fields the user edits; identity and timestamps are managed by the store. */
export type AlarmDraft = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;
