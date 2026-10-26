import React from 'react';
import { View } from 'react-native';
import { formatMoney } from '../../domain';
import { useTheme } from '../theme/Theme';
import { Card } from './Card';
import { Text } from './Text';
export function ReportSummary({
  income,
  spending,
  balance,
}: {
  income: number;
  spending: number;
  balance: number;
}) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text muted size={12}>
        NET CASH FLOW
      </Text>
      <Text
        size={32}
        weight="700"
        color={balance < 0 ? colors.negative : colors.ink}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {formatMoney(balance)}
      </Text>
      <View style={{ flexDirection: 'row', gap: 18 }}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text muted size={12}>
            Income
          </Text>
          <Text size={18} weight="700" color={colors.positive}>
            {formatMoney(income)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text muted size={12}>
            Spending
          </Text>
          <Text size={18} weight="700">
            {formatMoney(spending)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
