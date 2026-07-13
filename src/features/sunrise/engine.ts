/**
 * The sunrise engine: drives Hue lights from a warm ember up to the style's
 * daylight endpoint over the alarm's sunrise duration.
 *
 * Rather than the app nudging brightness every few seconds, we issue a handful
 * of **keyframes with long Hue `transition`s** — "go to 15% / 2700K over 10
 * minutes" — and let the Hue bridge interpolate. That is how the Hue app's
 * wake-up works: fewer calls, and the glide continues smoothly even if the
 * phone app is backgrounded or drops a beat.
 *
 * The brightness curve eases in (slow and dim for a while, then rising) so the
 * first half is a gentle glow, matching how we perceive light. The ramp can
 * begin part-way through, so opening the app 8 minutes into a 30-minute sunrise
 * snaps to the right brightness and carries on.
 *
 * Every Home Assistant call is wrapped: if HA is unreachable the ramp gives up
 * silently and the sound alarm still rings — the light is never a point of
 * failure.
 */

import { sunriseStyleOption } from '@/features/alarms/catalog';
import type { SunriseConfig } from '@/features/alarms/types';
import { activateScene, setLight, turnOffLights } from '@/features/homeassistant/client';
import type { HAConfig } from '@/features/homeassistant/types';

/** Keyframes as (progress, brightness%). Kelvin is interpolated from the style. */
const KEYFRAMES: readonly { p: number; brightnessPct: number }[] = [
  { p: 0, brightnessPct: 1 },
  { p: 0.34, brightnessPct: 15 },
  { p: 0.67, brightnessPct: 45 },
  { p: 1, brightnessPct: 100 },
];

export interface SunriseHandle {
  cancel: () => void;
}

interface LightState {
  brightnessPct: number;
  colorTempKelvin: number;
}

/** Whether this alarm should drive lights at all. */
export function shouldRunSunrise(sunrise: SunriseConfig): boolean {
  return sunrise.enabled && sunrise.targetEntityIds.length > 0;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function kelvinAt(sunrise: SunriseConfig, progress: number): number {
  const style = sunriseStyleOption(sunrise.style);

  return Math.round(lerp(style.fromKelvin, style.toKelvin, Math.min(1, Math.max(0, progress))));
}

/** The interpolated light state at an arbitrary point along the ramp. */
function stateAt(sunrise: SunriseConfig, progress: number): LightState {
  const clamped = Math.min(1, Math.max(0, progress));

  let lower = KEYFRAMES[0];
  let upper = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 1; i < KEYFRAMES.length; i++) {
    if (KEYFRAMES[i].p >= clamped) {
      lower = KEYFRAMES[i - 1];
      upper = KEYFRAMES[i];
      break;
    }
  }

  const span = upper.p - lower.p || 1;
  const localT = (clamped - lower.p) / span;

  return {
    brightnessPct: Math.max(1, Math.round(lerp(lower.brightnessPct, upper.brightnessPct, localT))),
    colorTempKelvin: kelvinAt(sunrise, clamped),
  };
}

async function pushLight(
  config: HAConfig,
  sunrise: SunriseConfig,
  state: LightState,
  transitionSeconds: number,
): Promise<void> {
  try {
    await setLight(config, sunrise.targetEntityIds, { ...state, transitionSeconds });
  } catch {
    // Home Assistant unreachable — let the sound alarm continue uninterrupted.
  }
}

/**
 * Ramp the lights to daylight over `totalMs`, treating `elapsedMs` as already
 * behind us. Returns a handle to stop early.
 */
export function startSunriseRamp(
  config: HAConfig,
  sunrise: SunriseConfig,
  totalMs: number,
  elapsedMs = 0,
): SunriseHandle {
  const startProgress = totalMs <= 0 ? 1 : Math.min(1, elapsedMs / totalMs);

  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Snap to where we should already be, then glide toward each remaining
  // keyframe using a transition that lasts until that keyframe is due.
  void pushLight(config, sunrise, stateAt(sunrise, startProgress), 2);

  let previousProgress = startProgress;

  for (const frame of KEYFRAMES) {
    if (frame.p <= startProgress) {
      continue;
    }

    const startDelayMs = Math.max(0, previousProgress * totalMs - elapsedMs);
    const transitionSeconds = Math.max(1, Math.round(((frame.p - previousProgress) * totalMs) / 1000));
    const target = stateAt(sunrise, frame.p);

    const timer = setTimeout(() => {
      if (!cancelled) {
        void pushLight(config, sunrise, target, transitionSeconds);
      }
    }, startDelayMs);

    timers.push(timer);
    previousProgress = frame.p;
  }

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    },
  };
}

/** Snap the lights straight to full daylight — used when the alarm actually rings. */
export async function setFullDaylight(config: HAConfig, sunrise: SunriseConfig): Promise<void> {
  await pushLight(config, sunrise, stateAt(sunrise, 1), 2);
}

/** Apply the chosen "after dismiss" behaviour. Best-effort; never throws. */
export async function applyPostDismiss(config: HAConfig, sunrise: SunriseConfig): Promise<void> {
  try {
    if (sunrise.postDismiss === 'off') {
      await turnOffLights(config, sunrise.targetEntityIds);
    } else if (sunrise.postDismiss === 'scene' && sunrise.postDismissSceneId) {
      await activateScene(config, sunrise.postDismissSceneId);
    }
    // 'hold' leaves the lights at full daylight — nothing to do.
  } catch {
    // Ignore — the room state is a nicety, not worth surfacing on dismiss.
  }
}
