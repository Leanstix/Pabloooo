import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 30, backgroundColor: active ? colors.ink : colors.raised }}><Text size={13} weight="600" color={active ? colors.background : colors.muted}>{label}</Text></Pressable>;
}
