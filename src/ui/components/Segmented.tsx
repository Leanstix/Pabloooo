import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  const { colors } = useTheme();
  return <View style={{ backgroundColor: colors.raised, borderRadius: 16, flexDirection: 'row', padding: 4, gap: 4 }}>{options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: option.value === value }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: option.value === value ? colors.surface : 'transparent' }}><Text weight="600" size={14} muted={option.value !== value}>{option.label}</Text></Pressable>)}</View>;
}
