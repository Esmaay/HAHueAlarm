/**
 * Uppercase eyebrow that titles a group of cards, matching the grouped-list
 * section header convention.
 */

import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

interface SectionLabelProps {
  children: string;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label" tone="mute" style={styles.text}>
        {children.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.space.xs,
    marginBottom: theme.space.sm,
  },
  text: {
    letterSpacing: 1.4,
  },
});
