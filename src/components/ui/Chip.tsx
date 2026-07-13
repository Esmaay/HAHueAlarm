/**
 * Small metadata chip with an optional leading icon, used on the alarm list to
 * surface a Hue room or sound at a glance. `accent` tints it amber for the Hue
 * chip so the light integration reads instantly.
 */

import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

interface ChipProps {
  label: string;
  icon?: LucideIcon;
  accent?: boolean;
}

export function Chip({ label, icon: Icon, accent = false }: ChipProps) {
  const color = accent ? theme.color.accent : theme.color.textSoft;

  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      {Icon ? <Icon size={11} color={color} strokeWidth={2} /> : null}

      <AppText variant="caption" tone={accent ? 'accent' : 'soft'} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceAlt,
  },
  chipAccent: {
    backgroundColor: 'rgba(255, 180, 90, 0.16)',
  },
});
