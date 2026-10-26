import React from 'react';
import { Pressable, View } from 'react-native';
import type { Budget, DateRange, FinanceState } from '../../domain/types';
import { formatMoney } from '../../domain';
import { Text } from './Text';
import { Progress } from './Progress';
import { useTheme } from '../theme/Theme';
export function BudgetRow({ budget, state, range, onPress }: { budget: Budget; state: FinanceState; range: DateRange; onPress: () => void }) {
  const { colors } = useTheme(); const category = state.categories.find(c => c.id === budget.categoryId);
  const ids = new Set([budget.categoryId, ...state.categories.filter(c => c.parentId === budget.categoryId).map(c => c.id)]);
  const spent = state.transactions.filter(t => !t.deletedAt && t.kind === 'expense' && ids.has(t.categoryId) && t.occurredAt >= range.start && t.occurredAt < range.end).reduce((sum, t) => sum + t.amountKobo, 0);
  const over = spent > budget.limitKobo;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${category?.name || 'category'} budget`} onPress={onPress} style={{ gap: 10, paddingVertical: 6 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text weight="700" style={{ flex: 1 }}>{category?.name || 'Category'}</Text><Text size={12} color={over ? colors.negative : colors.muted}>{Math.round(spent / budget.limitKobo * 100)}% used</Text></View><Progress label={`${category?.name} budget used`} value={spent / budget.limitKobo} color={over ? colors.negative : colors.positive} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text size={12} muted>{formatMoney(spent)} spent</Text><Text size={12} muted>of {formatMoney(budget.limitKobo)}</Text></View>{over && <Text size={12} color={colors.negative}>{formatMoney(spent - budget.limitKobo)} over this limit</Text>}</Pressable>;
}
