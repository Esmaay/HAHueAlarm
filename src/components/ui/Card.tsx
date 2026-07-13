/**
 * Grouped surface that draws hairline separators between its children,
 * mirroring the inset grouped-list pattern used across iOS settings.
 *
 * Children render in order; a divider is inserted between adjacent items so
 * rows never manage their own borders.
 */

import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.card, style]}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.border,
    marginLeft: theme.space.lg,
  },
});
