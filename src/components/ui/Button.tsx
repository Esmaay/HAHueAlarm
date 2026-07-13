/**
 * Primary / secondary / ghost button.
 *
 * Full-width by default (the common mobile case); pass `inline` for content-hug.
 */

import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  inline = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const contentTone = isPrimary ? 'onAccent' : variant === 'ghost' ? 'accent' : 'default';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inline ? styles.inline : styles.full,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {Icon ? (
          <Icon
            size={18}
            color={isPrimary ? theme.color.onAccent : theme.color.accent}
            strokeWidth={2.2}
          />
        ) : null}

        <AppText variant="body" tone={contentTone} weight="bold">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  full: {
    alignSelf: 'stretch',
  },
  inline: {
    alignSelf: 'center',
  },
  primary: {
    backgroundColor: theme.color.accent,
  },
  secondary: {
    backgroundColor: theme.color.surfaceAlt,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
});
