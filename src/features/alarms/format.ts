/**
 * Pure formatting and scheduling helpers for alarms.
 *
 * No React, no state, no side effects — trivially unit-testable and shared by
 * every screen so time/label logic lives in exactly one place.
 */

import type { Alarm, Weekday } from './types';
import { WEEKDAYS_DISPLAY_ORDER } from './types';

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

const SHORT_DAY_LABELS: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

const SINGLE_DAY_LABELS: Record<Weekday, string> = {
  0: 'S',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'T',
  5: 'F',
  6: 'S',
};

const WEEKDAY_SET = [1, 2, 3, 4, 5];
const WEEKEND_SET = [0, 6];

export interface ClockParts {
  /** Hour as shown on a 12-hour clock (1–12). */
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

/** Split a 24h time into display parts. Minutes are zero-padded. */
export function toClockParts(hour: number, minute: number): ClockParts {
  const period = hour < 12 ? 'AM' : 'PM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;

  return {
    hour: String(twelveHour),
    minute: minute.toString().padStart(2, '0'),
    period,
  };
}

/** e.g. "6:30". Period is returned separately by `toClockParts`. */
export function formatTime(hour: number, minute: number): string {
  const parts = toClockParts(hour, minute);

  return `${parts.hour}:${parts.minute}`;
}

function sameMembers(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const set = new Set(a);

  return b.every((day) => set.has(day));
}

/** Single-letter labels for a day selector, always Monday-first. */
export function weekdayInitials(): { day: Weekday; label: string }[] {
  return WEEKDAYS_DISPLAY_ORDER.map((day) => ({ day, label: SINGLE_DAY_LABELS[day] }));
}

/**
 * Human summary of a repeat rule: "Every day", "Weekdays", "Weekends",
 * "Mon, Wed, Fri", or "Once" when the alarm does not repeat.
 */
export function formatRepeat(repeatDays: Weekday[]): string {
  if (repeatDays.length === 0) {
    return 'Once';
  }

  if (repeatDays.length === 7) {
    return 'Every day';
  }

  if (sameMembers(repeatDays, WEEKDAY_SET)) {
    return 'Weekdays';
  }

  if (sameMembers(repeatDays, WEEKEND_SET)) {
    return 'Weekends';
  }

  return WEEKDAYS_DISPLAY_ORDER.filter((day) => repeatDays.includes(day))
    .map((day) => SHORT_DAY_LABELS[day])
    .join(', ');
}

/** The scheduling essentials shared by saved alarms and in-progress drafts. */
type Schedule = Pick<Alarm, 'hour' | 'minute' | 'repeatDays'>;

/**
 * The next moment a schedule should fire, relative to `from`.
 *
 * Repeating schedules find the next matching weekday; one-shot schedules fire
 * today if the time is still ahead, otherwise tomorrow.
 */
export function nextOccurrenceOf(schedule: Schedule, from: Date = new Date()): Date {
  const candidate = new Date(from);

  candidate.setSeconds(0, 0);
  candidate.setHours(schedule.hour, schedule.minute, 0, 0);

  if (schedule.repeatDays.length === 0) {
    if (candidate.getTime() <= from.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  for (let offset = 0; offset < 8; offset++) {
    const day = ((from.getDay() + offset) % 7) as Weekday;
    const isFutureToday = offset === 0 && candidate.getTime() > from.getTime();

    if (schedule.repeatDays.includes(day) && (offset > 0 || isFutureToday)) {
      candidate.setDate(from.getDate() + offset);
      candidate.setHours(schedule.hour, schedule.minute, 0, 0);

      return candidate;
    }
  }

  // Unreachable for a non-empty repeat set, but keeps the return type total.
  return candidate;
}

/** Convenience wrapper for a full alarm. */
export function nextOccurrence(alarm: Alarm, from: Date = new Date()): Date {
  return nextOccurrenceOf(alarm, from);
}

/** Coarse "5h 12m"-style distance between two instants; "now" when non-positive. */
function formatDistance(target: Date, from: Date): string {
  const totalMinutes = Math.round((target.getTime() - from.getTime()) / MS_PER_MINUTE);

  if (totalMinutes <= 0) {
    return 'now';
  }

  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  // Only show minutes when they add precision the coarser units lack.
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
}

/**
 * Relative distance to the next fire, e.g. "in 12h 24m", "in 8h", "in 1m".
 * Returns null when the alarm is disabled.
 */
export function timeUntil(alarm: Alarm, from: Date = new Date()): string | null {
  if (!alarm.enabled) {
    return null;
  }

  const distance = formatDistance(nextOccurrence(alarm, from), from);

  return distance === 'now' ? 'now' : `in ${distance}`;
}

/** Editor preview, e.g. "Rings in 12h 24m", computed from an in-progress draft. */
export function formatRingsIn(schedule: Schedule, from: Date = new Date()): string {
  const distance = formatDistance(nextOccurrenceOf(schedule, from), from);

  return distance === 'now' ? 'Rings now' : `Rings in ${distance}`;
}

/** The soonest-firing enabled alarm, or null if none are active. */
export function nextEnabledAlarm(alarms: Alarm[], from: Date = new Date()): Alarm | null {
  return alarms
    .filter((alarm) => alarm.enabled)
    .reduce<{ alarm: Alarm; at: number } | null>((soonest, alarm) => {
      const at = nextOccurrence(alarm, from).getTime();

      if (!soonest || at < soonest.at) {
        return { alarm, at };
      }

      return soonest;
    }, null)?.alarm ?? null;
}
