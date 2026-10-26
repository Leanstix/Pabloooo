import React, { useState } from 'react';
import { View } from 'react-native';
import { spendingScenario } from '../scenario';
import { Card } from './Card';
import { Field } from './Field';
import { Section } from './Section';
import { Text } from './Text';
import { useTheme } from '../theme/Theme';
export function WhatIf({ remaining, days }: { remaining: number; days: number }) {
  const { colors } = useTheme();
  const [cut, setCut] = useState('');
  const [extra, setExtra] = useState('');
  const result = spendingScenario(remaining, days, cut, extra);
  return (
    <Card style={{ backgroundColor: colors.raised, borderWidth: 0 }}>
      <Section title="What if…" detail="Explore a change before you make it." />
      <Field
        label="I cut future spending by · NGN"
        value={cut}
        onChangeText={setCut}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <Field
        label="I earn a little extra · NGN"
        value={extra}
        onChangeText={setExtra}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {result.ok ? (
        <View style={{ gap: 5 }}>
          <Text size={12} muted>
            YOUR POSSIBLE CYCLE REMAINDER
          </Text>
          <Text size={28} weight="700">
            {result.total}
          </Text>
          <Text size={13} muted>
            {result.daily} per remaining day
          </Text>
        </View>
      ) : (
        <Text accessibilityRole="alert" color={colors.negative}>
          {result.error}
        </Text>
      )}
      <Text size={11} muted>
        A simple scenario, not a forecast. These amounts don’t change your saved entries or budgets.
      </Text>
    </Card>
  );
}
