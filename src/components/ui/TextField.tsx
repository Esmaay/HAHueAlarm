/**
 * Single-line (or multiline) text input styled for the dark theme, with an
 * optional uppercase label above it. Wrap in <Card> for the grouped-list look.
 */

import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '@/theme';

import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label?: string;
}

export function TextField({ label, style, multiline, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="caption" tone="mute" style={styles.label}>
          {label.toUpperCase()}
        </AppText>
      ) : null}

      <TextInput
        placeholderTextColor={theme.color.textMute}
        style={[styles.input, multiline && styles.multiline, style]}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    gap: theme.space.xs,
  },
  label: {
    letterSpacing: 1.2,
  },
  input: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    paddingVertical: theme.space.xs,
    minHeight: 24,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
