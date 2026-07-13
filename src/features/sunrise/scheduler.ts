/**
 * Arms the pre-alarm sunrise: begins ramping the lights `durationMin` before the
 * soonest sunrise alarm fires (or immediately, at the right brightness, if the
 * app opens once the window has already started).
 *
 * A module-level singleton rather than a store — there is only ever one pending
 * sunrise, and `syncSunrise` is idempotent: called repeatedly with the same
 * upcoming alarm it does nothing, so re-renders and app resumes don't restart a
 * ramp in progress.
 *
 * Foreground only: JS timers pause when the app is backgrounded, so this drives
 * the "app open" experience. Always-on pre-ramp is a Notifee / HA-automation
 * follow-up.
 */

import { nextOccurrenceOf } from '@/features/alarms/format';
import type { Alarm } from '@/features/alarms/types';
import type { HAConfig } from '@/features/homeassistant/types';

import { shouldRunSunrise, startSunriseRamp, type SunriseHandle } from './engine';

let activeKey: string | null = null;
let handle: SunriseHandle | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function reset(): void {
  if (handle) {
    handle.cancel();
    handle = null;
  }

  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  activeKey = null;
}

/** Stop any pending or in-progress ramp (e.g. when the alarm starts ringing). */
export function cancelSunrise(): void {
  reset();
}

function soonestSunriseAlarm(alarms: Alarm[]): Alarm | null {
  return (
    alarms
      .filter((alarm) => alarm.enabled && shouldRunSunrise(alarm.sunrise))
      .map((alarm) => ({ alarm, at: nextOccurrenceOf(alarm).getTime() }))
      .sort((a, b) => a.at - b.at)[0]?.alarm ?? null
  );
}

/** Identity of an upcoming sunrise; changes when anything relevant is edited. */
function keyFor(alarm: Alarm, alarmTime: number): string {
  const { durationMin, style, targetEntityIds } = alarm.sunrise;

  return [alarm.id, alarmTime, durationMin, style, targetEntityIds.join(',')].join('|');
}

/**
 * Reconcile the armed sunrise with the current alarms. Call whenever alarms or
 * the HA connection change, and on app resume.
 */
export function syncSunrise(alarms: Alarm[], config: HAConfig | null): void {
  if (!config) {
    reset();

    return;
  }

  const alarm = soonestSunriseAlarm(alarms);

  if (!alarm) {
    reset();

    return;
  }

  const alarmTime = nextOccurrenceOf(alarm).getTime();
  const key = keyFor(alarm, alarmTime);

  if (key === activeKey) {
    return; // Already managing this exact sunrise — don't restart it.
  }

  reset();

  const durationMs = alarm.sunrise.durationMin * 60_000;
  const windowStart = alarmTime - durationMs;
  const now = Date.now();

  if (now >= alarmTime) {
    return; // Too late to ramp — the ring will light the room.
  }

  activeKey = key;

  const begin = () => {
    const elapsed = Math.max(0, Date.now() - windowStart);
    handle = startSunriseRamp(config, alarm.sunrise, durationMs, elapsed);
  };

  if (now >= windowStart) {
    begin(); // Inside the window already — pick up mid-ramp.
  } else {
    pendingTimer = setTimeout(begin, windowStart - now);
  }
}
