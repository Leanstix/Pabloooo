import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../theme/Theme';
export function Card({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.line,
          gap: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
