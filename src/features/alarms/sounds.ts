/**
 * Alarm sound ids.
 *
 * The audio itself lives in `assets/sounds/*.wav`, registered with the
 * expo-notifications config plugin which copies each file into Android's
 * res/raw. Notifee then plays them by resource name (the id), so no JS `require`
 * of the audio is needed here.
 *
 * Ids must be underscore-safe (a-z, 0-9, underscore) because they double as
 * Android resource names.
 */

export const SOUND_IDS = ['sunrise_tone', 'chimes', 'radar', 'classic_bell', 'birdsong'] as const;

const FALLBACK_SOUND_ID = 'sunrise_tone';

/** Normalise to a sound id we actually ship, falling back to the default. */
export function knownSoundId(id: string): string {
  return (SOUND_IDS as readonly string[]).includes(id) ? id : FALLBACK_SOUND_ID;
}
