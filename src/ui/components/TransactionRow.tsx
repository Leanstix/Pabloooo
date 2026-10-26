import React from 'react';
import { Pressable, View } from 'react-native';
import type { Category, Transaction } from '../../domain/types';
import { formatMoney } from '../../domain';
import { useTheme } from '../theme/Theme';
import { friendlyDate } from '../utils';
import { CategoryIcon } from './CategoryIcon';
import { Text } from './Text';
export function TransactionRow({
  item,
  category,
  onPress,
}: {
  item: Transaction;
  category?: Category;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.merchant || item.note || category?.name || 'Entry'}, ${item.kind}, ${formatMoney(item.amountKobo)}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 70,
        paddingVertical: 10,
      }}
    >
      <CategoryIcon category={category} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text weight="600" numberOfLines={1}>
          {item.merchant || item.note || category?.name || 'Entry'}
        </Text>
        <Text muted size={12} numberOfLines={1}>
          {category?.name || 'Archived category'} · {friendlyDate(item.occurredAt)}
        </Text>
      </View>
      <Text weight="700" size={15} color={item.kind === 'income' ? colors.positive : colors.ink}>
        {item.kind === 'income' ? '+' : '−'}
        {formatMoney(item.amountKobo)}
      </Text>
    </Pressable>
  );
}
