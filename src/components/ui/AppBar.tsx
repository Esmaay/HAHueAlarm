/**
 * Navigation-style top bar with a centred title and optional text actions.
 *
 * Text actions ("Cancel" / "Save") are the deliberate iOS-native choice over
 * icon buttons — words state the outcome unambiguously when you're half-awake.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

export interface BarAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** `accent` emphasises the primary action (Save); `default` is neutral. */
  tone?: 'default' | 'accent';
}

interface AppBarProps {
  title?: string;
  left?: BarAction;
  right?: BarAction;
}

function ActionButton({ action, align }: { action: BarAction; align: 'left' | 'right' }) {
  return (
    <Pressable
      onPress={action.onPress}
      disabled={action.disabled}
      hitSlop={theme.hitSlop}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        align === 'right' ? styles.alignEnd : styles.alignStart,
        pressed && styles.pressed,
        action.disabled && styles.disabled,
      ]}
    >
      <AppText
        variant="body"
        tone={action.tone === 'accent' ? 'accent' : 'soft'}
        weight={action.tone === 'accent' ? 'bold' : 'medium'}
      >
        {action.label}
      </AppText>
    </Pressable>
  );
}

export function AppBar({ title, left, right }: AppBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>{left ? <ActionButton action={left} align="left" /> : null}</View>

      <View style={styles.center} pointerEvents="none">
        {title ? (
          <AppText variant="heading" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>

      <View style={styles.side}>
        {right ? <ActionButton action={right} align="right" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.md,
  },
  side: {
    minWidth: 72,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  action: {
    paddingVertical: theme.space.sm,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.35,
  },
});
