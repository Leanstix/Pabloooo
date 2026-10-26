import React, { useState } from 'react';
import { View } from 'react-native';
import type { AppController } from '../../app/contracts';
import type { EntryKind, Frequency, RecurringRule } from '../../domain/types';
import { parseMoney } from '../../domain';
import { Sheet } from '../components/Sheet';
import { Field } from '../components/Field';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Segmented } from '../components/Segmented';
import { CategoryPicker } from '../components/CategoryPicker';
import { Chip } from '../components/Chip';
import { useTask } from '../hooks/useTask';
import { confirmDelete, today, uid, validDate } from '../utils';
export function RecurringEditor({
  controller,
  rule,
  onClose,
}: {
  controller: AppController;
  rule?: RecurringRule;
  onClose: () => void;
}) {
  const [name, setName] = useState(rule?.name || '');
  const [amount, setAmount] = useState(rule ? String(rule.amountKobo / 100) : '');
  const [kind, setKind] = useState<EntryKind>(rule?.kind || 'expense');
  const [categoryId, setCategory] = useState(rule?.categoryId || '');
  const [frequency, setFrequency] = useState<Frequency>(rule?.frequency || 'monthly');
  const [date, setDate] = useState(rule?.nextDueDate || today());
  const task = useTask();
  function save() {
    const amountKobo = parseMoney(amount);
    if (!name.trim() || !amountKobo || amountKobo < 0 || !categoryId || !validDate(date))
      return task.setError('Enter a name, positive amount, category and valid next due date.');
    task.run(
      () =>
        controller.dispatch({
          type: 'recurring.save',
          value: {
            id: rule?.id || uid(),
            name: name.trim(),
            amountKobo,
            kind,
            categoryId,
            frequency,
            nextDueDate: date,
            active: rule?.active ?? true,
          },
        }),
      onClose,
    );
  }
  return (
    <Sheet
      title={rule ? 'Edit recurring entry' : 'The regular things'}
      subtitle="Track what repeats. Confirm each payment when it happens."
      visible
      onClose={onClose}
    >
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Internet subscription"
        maxLength={80}
      />
      <Segmented
        value={kind}
        onChange={(value) => {
          setKind(value);
          setCategory('');
        }}
        options={[
          { value: 'expense', label: 'Money out' },
          { value: 'income', label: 'Money in' },
        ]}
      />
      <Field
        label="Amount · NGN"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <CategoryPicker
        categories={controller.state.categories}
        kind={kind}
        value={categoryId}
        onChange={setCategory}
      />
      <Text size={13} weight="600">
        Repeats
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map((value) => (
          <Chip
            key={value}
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            active={frequency === value}
            onPress={() => setFrequency(value)}
          />
        ))}
      </View>
      <Field label="Next due date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      {!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}
      <Button label="Save recurring entry" onPress={save} busy={task.busy} />
      {rule && (
        <Button
          label="Remove recurring entry"
          variant="danger"
          onPress={() =>
            confirmDelete(
              'Remove this schedule?',
              () =>
                task.run(
                  () => controller.dispatch({ type: 'recurring.delete', id: rule.id }),
                  onClose,
                ),
              'Previously confirmed entries will stay in your ledger.',
            )
          }
        />
      )}
    </Sheet>
  );
}
