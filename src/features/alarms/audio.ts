/**
 * Looping alarm audio with a gentle volume ramp.
 *
 * A single module-level player is enough — only one alarm rings at a time. The
 * ramp starts quiet and climbs to full so waking is a swell, not a jolt, in
 * keeping with the sunrise. Playback is forced on even when the ringer is
 * silenced, because an alarm must be heard.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const START_VOLUME = 0.15;
const STEP_MS = 500;

let player: AudioPlayer | null = null;
let rampTimer: ReturnType<typeof setInterval> | null = null;

function clearRamp(): void {
  if (rampTimer) {
    clearInterval(rampTimer);
    rampTimer = null;
  }
}

/** Start looping the given sound asset, ramping volume up over `rampSeconds`. */
export async function startAlarmSound(asset: number, rampSeconds = 15): Promise<void> {
  await stopAlarmSound();
  await setAudioModeAsync({ playsInSilentMode: true });

  const active = createAudioPlayer(asset);

  active.loop = true;
  active.volume = START_VOLUME;
  active.play();
  player = active;

  const steps = Math.max(1, Math.round((rampSeconds * 1000) / STEP_MS));
  let elapsed = 0;

  rampTimer = setInterval(() => {
    elapsed += 1;
    const volume = Math.min(1, START_VOLUME + (1 - START_VOLUME) * (elapsed / steps));

    if (player) {
      player.volume = volume;
    }

    if (volume >= 1) {
      clearRamp();
    }
  }, STEP_MS);
}

/** Stop playback and release the player. Safe to call when nothing is playing. */
export async function stopAlarmSound(): Promise<void> {
  clearRamp();

  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // Player already released — nothing to do.
    }

    player = null;
  }
}
