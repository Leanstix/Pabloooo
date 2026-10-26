import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export function Field({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Text size={13} weight="600">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.positive}
        {...props}
        style={[
          {
            backgroundColor: colors.raised,
            borderRadius: 14,
            minHeight: 50,
            color: colors.ink,
            paddingHorizontal: 15,
            paddingVertical: 13,
            fontSize: 16,
            borderWidth: 1,
            borderColor: error ? colors.negative : 'transparent',
          },
          style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" size={12} color={colors.negative}>
          {error}
        </Text>
      ) : hint ? (
        <Text size={12} muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
