/**
 * The single text primitive for the app.
 *
 * Every string on screen goes through a named `variant` so the type scale,
 * weights, and colours stay consistent and live in one place. Raw `<Text>` with
 * ad-hoc styles should not appear in feature code.
 */

import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { theme } from '@/theme';

export type TextVariant =
  | 'clock'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'mono';

export type TextTone = 'default' | 'soft' | 'mute' | 'accent' | 'onAccent' | 'danger';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Enables lining, tabular figures — use wherever digits must align. */
  tabular?: boolean;
  weight?: keyof typeof theme.font.weight;
}

const TONE_COLORS: Record<TextTone, string> = {
  default: theme.color.text,
  soft: theme.color.textSoft,
  mute: theme.color.textMute,
  accent: theme.color.accent,
  onAccent: theme.color.onAccent,
  danger: theme.color.danger,
};

export function AppText({
  variant = 'body',
  tone = 'default',
  tabular = false,
  weight,
  style,
  ...rest
}: AppTextProps) {
  const overrideWeight: TextStyle | undefined = weight
    ? { fontWeight: theme.font.weight[weight] }
    : undefined;

  return (
    <Text
      style={[
        styles[variant],
        { color: TONE_COLORS[tone] },
        tabular && styles.tabular,
        overrideWeight,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  clock: {
    fontSize: theme.font.size.clock,
    fontWeight: theme.font.weight.regular,
    letterSpacing: -2,
  },
  display: {
    fontSize: theme.font.size.display,
    fontWeight: theme.font.weight.heavy,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.semibold,
  },
  body: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.regular,
  },
  label: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
    letterSpacing: 0.4,
  },
  caption: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.medium,
    letterSpacing: 0.3,
  },
  mono: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.medium,
    fontVariant: ['tabular-nums'],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
