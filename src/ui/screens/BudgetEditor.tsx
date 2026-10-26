import React, { useState } from 'react';
import type { AppController } from '../../app/contracts';
import type { Budget } from '../../domain/types';
import { cycleKey, parseMoney } from '../../domain';
import { Sheet } from '../components/Sheet';
import { Field } from '../components/Field';
import { CategoryPicker } from '../components/CategoryPicker';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useTask } from '../hooks/useTask';
import { confirmDelete, today, uid } from '../utils';
export function BudgetEditor({
  controller,
  budget,
  onClose,
}: {
  controller: AppController;
  budget?: Budget;
  onClose: () => void;
}) {
  const [categoryId, setCategory] = useState(budget?.categoryId || '');
  const [amount, setAmount] = useState(budget ? String(budget.limitKobo / 100) : '');
  const task = useTask();
  function save() {
    const limitKobo = parseMoney(amount);
    if (!limitKobo || limitKobo < 0 || !categoryId)
      return task.setError('Choose a category and enter a positive limit.');
    task.run(
      () =>
        controller.dispatch({
          type: 'budget.save',
          value: {
            id: budget?.id || uid(),
            categoryId,
            limitKobo,
            cycleKey: cycleKey(today(), controller.state.settings.cycleStartDay),
          },
        }),
      onClose,
    );
  }
  return (
    <Sheet
      title={budget ? 'Adjust your budget' : 'Give spending a boundary'}
      subtitle="A category limit for your current budget cycle."
      visible
      onClose={onClose}
    >
      <CategoryPicker
        categories={controller.state.categories}
        kind="expense"
        value={categoryId}
        onChange={setCategory}
      />
      <Field
        label="Spending limit · NGN"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}
      <Button label="Save budget" onPress={save} busy={task.busy} />
      {budget && (
        <Button
          label="Remove budget"
          variant="danger"
          onPress={() =>
            confirmDelete('Remove this budget?', () =>
              task.run(
                () => controller.dispatch({ type: 'budget.delete', id: budget.id }),
                onClose,
              ),
            )
          }
        />
      )}
    </Sheet>
  );
}
