import React from 'react';
import { View } from 'react-native';
import type { FinanceState, DateRange } from '../../domain/types';
import { categoryBreakdown, formatMoney } from '../../domain';
import { Text } from './Text';
import { Progress } from './Progress';
import { EmptyState } from './EmptyState';
import { useTheme } from '../theme/Theme';
export function CategoryBreakdown({ state, range }: { state: FinanceState; range: DateRange }) {
  const { colors } = useTheme(); const items = categoryBreakdown(state, range).filter(x => x.kind === 'expense' && x.amountKobo > 0).sort((a, b) => b.amountKobo - a.amountKobo);
  const max = Math.max(1, ...items.map(x => x.amountKobo));
  return <View style={{ gap: 22 }}>{items.length ? items.map(item => <View key={item.categoryId} style={{ gap: 9 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text weight="600" style={{ flex: 1 }}>{item.name}</Text><Text weight="600">{formatMoney(item.amountKobo)}</Text></View><Progress value={item.amountKobo / max} color={state.categories.find(c => c.id === item.categoryId)?.color || colors.positive} label={`${item.name} spending`} /><Text size={11} muted>{item.percentOfIncome === null ? 'No income recorded in this period' : `${item.percentOfIncome.toFixed(1)}% of recorded income`}</Text></View>) : <EmptyState title="Your patterns will appear here" body="Add a few expenses to see where your money goes." />}</View>;
}
