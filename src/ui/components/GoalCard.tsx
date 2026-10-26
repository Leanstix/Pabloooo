import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SavingsGoal } from '../../domain/types';
import { formatMoney } from '../../domain';
import { Text } from './Text';
import { Progress } from './Progress';
import { useTheme } from '../theme/Theme';
export function GoalCard({ goal, onPress }: { goal: SavingsGoal; onPress: () => void }) {
  const { colors } = useTheme(); const complete = goal.savedKobo >= goal.targetKobo;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Update ${goal.name} savings goal`} onPress={onPress} style={{ paddingVertical: 8, gap: 11 }}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={complete ? 'checkmark' : 'flag-outline'} size={21} color={colors.ink} /></View><View style={{ flex: 1, gap: 2 }}><Text weight="700">{goal.name}</Text><Text size={12} muted>{complete ? 'You made it. Take a moment.' : goal.targetDate ? `Aiming for ${goal.targetDate}` : 'One step at a time'}</Text></View><Text weight="700" size={13}>{Math.round(goal.savedKobo / goal.targetKobo * 100)}%</Text></View><Progress value={goal.savedKobo / goal.targetKobo} label={`${goal.name} progress`} /><Text size={12} muted>{formatMoney(goal.savedKobo)} of {formatMoney(goal.targetKobo)}</Text></Pressable>;
}
