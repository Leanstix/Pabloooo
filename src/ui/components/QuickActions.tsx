import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export function QuickActions({ expense, income, calculator }: { expense: () => void; income: () => void; calculator: () => void }) {
  const { colors } = useTheme();
  const actions = [{ label: 'Add expense', icon: 'arrow-up' as const, action: expense, color: colors.accent }, { label: 'Add income', icon: 'arrow-down' as const, action: income, color: colors.violet }, { label: 'Calculate', icon: 'calculator-outline' as const, action: calculator, color: colors.orange }];
  return <View style={{ flexDirection: 'row', gap: 10 }}>{actions.map(item => <Pressable key={item.label} accessibilityRole="button" onPress={item.action} style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: colors.surface, borderRadius: 22, gap: 10, borderColor: colors.line, borderWidth: 1 }}><View style={{ backgroundColor: item.color, width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon} size={22} color={colors.ink} /></View><Text size={11} weight="600">{item.label}</Text></Pressable>)}</View>;
}
