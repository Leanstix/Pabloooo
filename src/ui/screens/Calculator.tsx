import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useTheme } from '../theme/Theme';
import { calculate } from '../calculator';
import type { EntryDraft } from './EntryEditor';
export function Calculator({
  onClose,
  add,
}: {
  onClose: () => void;
  add: (draft: EntryDraft) => void;
}) {
  const { colors } = useTheme();
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const result = calculate(expression);
  function key(value: string) {
    setError('');
    if (value === 'C') return setExpression('');
    if (value === '⌫') return setExpression(expression.slice(0, -1));
    if (value === '=') {
      if (result === null) setError('Finish the calculation and check for division by zero.');
      else setExpression(String(result));
      return;
    }
    if (expression.length < 100) setExpression(expression + value);
  }
  return (
    <Sheet
      title="Work it out"
      subtitle="A quick calculation, ready for your next entry."
      visible
      onClose={onClose}
    >
      <View
        style={{
          padding: 20,
          borderRadius: 20,
          backgroundColor: colors.raised,
          gap: 8,
          minHeight: 120,
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <Text size={22} numberOfLines={2}>
          {expression || '0'}
        </Text>
        <Text size={34} weight="700">
          {result === null ? '—' : result.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          'C',
          '⌫',
          '÷',
          '×',
          '7',
          '8',
          '9',
          '−',
          '4',
          '5',
          '6',
          '+',
          '1',
          '2',
          '3',
          '=',
          '0',
          '.',
          '00',
        ].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={
              value === '⌫'
                ? 'Backspace'
                : value === 'C'
                  ? 'Clear'
                  : value === '='
                    ? 'Equals'
                    : value
            }
            onPress={() => key(value)}
            style={{
              width: '22.7%',
              minHeight: 56,
              borderRadius: 16,
              backgroundColor: value === '=' ? colors.accent : colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text size={23} weight="600" color={value === '=' ? colors.accentInk : colors.ink}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" color={colors.negative}>
          {error}
        </Text>
      )}
      <Button
        label="Use as expense"
        disabled={result === null || result <= 0}
        icon="arrow-up"
        onPress={() => {
          onClose();
          add({ kind: 'expense', amount: result!.toFixed(2) });
        }}
      />
      <Button
        label="Use as income"
        disabled={result === null || result <= 0}
        variant="secondary"
        icon="arrow-down"
        onPress={() => {
          onClose();
          add({ kind: 'income', amount: result!.toFixed(2) });
        }}
      />
    </Sheet>
  );
}
