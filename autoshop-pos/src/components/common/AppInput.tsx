import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | undefined;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={Colors.gray300}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...textInputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    color: Colors.black,
    backgroundColor: Colors.surface,
  },
  inputFocused: { borderColor: Colors.primary },
  inputError: { borderColor: Colors.danger },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
  },
});
