/**
 * HAHueAlarm design tokens.
 *
 * The app deliberately commits to a single, nocturnal world — a warm charcoal
 * ground with one amber accent (the Hue "daylight" glow). There is no light
 * theme by design: the interface lives on a nightstand in a dark room.
 *
 * Every screen and component reads from this object; no raw hex values live in
 * component files.
 */

export const palette = {
  night: '#14110D',
  night2: '#1B1712',
  surface: '#201B15',
  surface2: '#2A241C',
  surface3: '#332B21',
  line: '#3A3228',
  lineSoft: '#2E281F',

  ink: '#F6F1E8',
  inkSoft: '#CABFAC',
  inkMute: '#8F8472',

  dawn: '#FFB45A',
  dawnDeep: '#FF8A4C',
  dawnHot: '#FF6A4D',
  ember: '#B5502A',
  daylight: '#FFF2DD',

  good: '#6ECF9A',
  warn: '#FFCF5C',
  danger: '#FF6A4D',

  black: '#000000',
  white: '#FFFFFF',
} as const;

/** The staged colours of the sunrise ramp, warm-dim ember → bright daylight. */
export const sunriseStops = ['#160C05', '#3A160A', '#8F2F16', '#E0662A', '#FFB45A', '#FFF2DD'] as const;

export const theme = {
  color: {
    bg: palette.night,
    bgElevated: palette.night2,
    surface: palette.surface,
    surfaceAlt: palette.surface2,
    surfacePressed: palette.surface3,
    border: palette.line,
    borderSoft: palette.lineSoft,

    text: palette.ink,
    textSoft: palette.inkSoft,
    textMute: palette.inkMute,

    accent: palette.dawn,
    accentDeep: palette.dawnDeep,
    accentHot: palette.dawnHot,
    onAccent: palette.night,

    success: palette.good,
    warning: palette.warn,
    danger: palette.danger,
  },

  /** 4pt spacing scale. */
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 999,
  },

  font: {
    size: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      display: 34,
      clock: 72,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
  },

  /** Hit target for controls used half-asleep — never below 44pt. */
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  minTouch: 44,
} as const;

export type Theme = typeof theme;

/**
 * Hook form of the theme. Static today, but every consumer goes through it so a
 * future runtime theme (e.g. an auto-dimming "deep night" variant) is a
 * one-file change.
 */
export function useTheme(): Theme {
  return theme;
}
