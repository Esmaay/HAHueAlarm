/**
 * A live preview of the light ramp for a given style: a warm-dim ember on the
 * left brightening to the style's daylight endpoint on the right, annotated
 * with the brightness and colour-temperature range.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { sunriseStyleOption } from '@/features/alarms/catalog';
import type { SunriseStyle } from '@/features/alarms/types';
import { palette, theme } from '@/theme';

interface SunrisePreviewProps {
  style: SunriseStyle;
}

/** LinearGradient wants a non-empty tuple; our catalog gradients always qualify. */
type GradientColors = readonly [string, string, ...string[]];

export function SunrisePreview({ style }: SunrisePreviewProps) {
  const option = sunriseStyleOption(style);

  return (
    <LinearGradient
      colors={option.gradient as GradientColors}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.ramp}
    >
      <View style={styles.overlay}>
        <AppText variant="caption" tone="onAccent" weight="semibold" style={styles.caption}>
          1% → 100% · {option.fromKelvin}K → {option.toKelvin}K
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ramp: {
    height: 116,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  overlay: {
    padding: theme.space.md,
  },
  caption: {
    color: palette.white,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
