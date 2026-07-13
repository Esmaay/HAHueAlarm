/**
 * A settings row: optional leading icon, a label, and either a value + chevron
 * (navigational) or an arbitrary trailing node (e.g. a Switch).
 *
 * Designed to sit inside <Card>, which supplies the separators.
 */

import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

interface RowProps {
  label: string;
  icon?: LucideIcon;
  /** Muted text shown before the chevron on navigational rows. */
  value?: string;
  onPress?: () => void;
  /** Replaces the value/chevron with a custom control. */
  trailing?: ReactNode;
  /** Small pill drawn just before the value, e.g. a "SHAKE" badge. */
  badge?: string;
  destructive?: boolean;
}

export function Row({
  label,
  icon: Icon,
  value,
  onPress,
  trailing,
  badge,
  destructive = false,
}: RowProps) {
  const interactive = Boolean(onPress);
  const showChevron = interactive && !trailing;

  const content = (
    <View style={styles.row}>
      {Icon ? (
        <View style={styles.iconSlot}>
          <Icon
            size={18}
            color={destructive ? theme.color.danger : theme.color.textSoft}
            strokeWidth={2}
          />
        </View>
      ) : null}

      <AppText variant="body" tone={destructive ? 'danger' : 'default'} style={styles.label}>
        {label}
      </AppText>

      {trailing ?? (
        <View style={styles.trailing}>
          {badge ? (
            <View style={styles.badge}>
              <AppText variant="caption" tone="onAccent" weight="heavy">
                {badge}
              </AppText>
            </View>
          ) : null}

          {value ? (
            <AppText variant="body" tone="mute" numberOfLines={1} style={styles.value}>
              {value}
            </AppText>
          ) : null}

          {showChevron ? (
            <ChevronRight size={18} color={theme.color.textMute} strokeWidth={2} />
          ) : null}
        </View>
      )}
    </View>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.lg,
    minHeight: 52,
    gap: theme.space.md,
  },
  iconSlot: {
    width: 22,
    alignItems: 'center',
  },
  label: {
    flexShrink: 0,
  },
  trailing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.space.sm,
  },
  value: {
    flexShrink: 1,
  },
  badge: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
  },
  pressed: {
    backgroundColor: theme.color.surfacePressed,
  },
});
