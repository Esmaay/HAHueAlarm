/**
 * The sunrise engine: drives Hue lights from a warm ember up to the style's
 * daylight endpoint while an alarm rings.
 *
 * Because a killed app can't pre-ramp before the alarm, we ramp *at* ring time
 * over a short window. Every Home Assistant call is wrapped — if HA is
 * unreachable the ramp silently gives up and the sound alarm carries on, so the
 * light is always an enhancement and never a point of failure.
 */

import { sunriseStyleOption } from '@/features/alarms/catalog';
import type { SunriseConfig } from '@/features/alarms/types';
import { activateScene, setLight, turnOffLights } from '@/features/homeassistant/client';
import type { HAConfig } from '@/features/homeassistant/types';

/** Total ramp time once the alarm fires. */
const RAMP_SECONDS = 60;
/** Seconds between brightness/temperature updates. */
const STEP_SECONDS = 4;

export interface SunriseHandle {
  cancel: () => void;
}

/** Whether this alarm should drive lights at all. */
export function shouldRunSunrise(sunrise: SunriseConfig): boolean {
  return sunrise.enabled && sunrise.targetEntityIds.length > 0;
}

/**
 * Begin ramping the lights. Returns a handle to stop early; runs entirely via
 * timers so the caller (the ringing screen) stays responsive.
 */
export function startSunrise(config: HAConfig, sunrise: SunriseConfig): SunriseHandle {
  const style = sunriseStyleOption(sunrise.style);
  const steps = Math.max(1, Math.round(RAMP_SECONDS / STEP_SECONDS));

  let step = 0;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (cancelled) {
      return;
    }

    step += 1;
    const progress = Math.min(1, step / steps);
    const brightnessPct = Math.max(1, Math.round(progress * 100));
    const colorTempKelvin = Math.round(
      style.fromKelvin + (style.toKelvin - style.fromKelvin) * progress,
    );

    try {
      await setLight(config, sunrise.targetEntityIds, { brightnessPct, colorTempKelvin });
    } catch {
      // Home Assistant unreachable — let the sound alarm continue uninterrupted.
    }

    if (progress < 1 && !cancelled) {
      timer = setTimeout(tick, STEP_SECONDS * 1000);
    }
  };

  // Kick off immediately so the lights start glowing as the alarm rings.
  timer = setTimeout(tick, 0);

  return {
    cancel: () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    },
  };
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
