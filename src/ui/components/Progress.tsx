import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/Theme';
export function Progress({
  value,
  color,
  label,
}: {
  value: number;
  color?: string;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.max(0, Math.min(1, value)) * 100),
      }}
      style={{ height: 8, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.raised }}
    >
      <View
        style={{
          height: 8,
          borderRadius: 8,
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color || colors.positive,
        }}
      />
    </View>
  );
}
