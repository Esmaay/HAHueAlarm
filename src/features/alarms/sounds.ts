/**
 * Maps sound ids to their bundled audio assets.
 *
 * Kept separate from `catalog.ts` (which stays pure serialisable data) because
 * `require` returns an opaque asset module handle, not JSON.
 *
 * The same files are registered with expo-notifications in app.json, so the OS
 * notification and the in-app looping player use one set of tones.
 */

// Keys double as Android res/raw resource names, so they must be
// underscore-safe (no hyphens): a-z, 0-9, underscore only.
const SOUND_ASSETS: Record<string, number> = {
  sunrise_tone: require('../../../assets/sounds/sunrise_tone.wav'),
  chimes: require('../../../assets/sounds/chimes.wav'),
  radar: require('../../../assets/sounds/radar.wav'),
  classic_bell: require('../../../assets/sounds/classic_bell.wav'),
  birdsong: require('../../../assets/sounds/birdsong.wav'),
};

const FALLBACK_SOUND_ID = 'sunrise_tone';

/** All shipped sound ids, in catalog order-ish; used to build channels. */
export const SOUND_IDS: readonly string[] = Object.keys(SOUND_ASSETS);

/** Normalise to a sound id we actually ship, falling back to the default. */
export function knownSoundId(id: string): string {
  return id in SOUND_ASSETS ? id : FALLBACK_SOUND_ID;
}

/** The bundled asset module for a sound id, falling back to the default tone. */
export function soundAsset(id: string): number {
  return SOUND_ASSETS[knownSoundId(id)];
}

/** The file name expo-notifications expects for the OS notification sound. */
export function notificationSoundName(id: string): string {
  return `${knownSoundId(id)}.wav`;
}
