/**
 * Circular icon button with a comfortable, half-asleep-friendly hit area.
 *
 * Accepts a Lucide icon component so callers stay declarative:
 *   <IconButton icon={Plus} onPress={…} accessibilityLabel="Add alarm" />
 */

import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  /** Icon colour; defaults to the amber accent. */
  color?: string;
  size?: number;
  variant?: 'solid' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  color = theme.color.accent,
  size = 22,
  variant = 'solid',
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={theme.hitSlop}
      style={({ pressed }) => [
        styles.base,
        variant === 'solid' && styles.solid,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: theme.minTouch,
    height: theme.minTouch,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: theme.color.surfaceAlt,
  },
  pressed: {
    opacity: 0.6,
  },
});
