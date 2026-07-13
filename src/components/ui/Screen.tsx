/**
 * Screen wrapper: the night background plus safe-area padding.
 *
 * `edges` lets callers opt out of top insets when a custom header already
 * handles them. Scrollable content is opt-in via `scroll`.
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { theme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  contentStyle,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.space.xxxl,
  },
});
