import React, { useState } from 'react';
import type { AppController } from '../../app/contracts';
import type { SavingsGoal } from '../../domain/types';
import { parseMoney } from '../../domain';
import { Sheet } from '../components/Sheet';
import { Field } from '../components/Field';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useTask } from '../hooks/useTask';
import { confirmDelete, uid, validDate } from '../utils';
export function GoalEditor({ controller, goal, onClose }: { controller: AppController; goal?: SavingsGoal; onClose: () => void }) {
  const [name, setName] = useState(goal?.name || ''); const [target, setTarget] = useState(goal ? String(goal.targetKobo / 100) : ''); const [saved, setSaved] = useState(goal ? String(goal.savedKobo / 100) : '0'); const [date, setDate] = useState(goal?.targetDate || ''); const task = useTask();
  function save() { const targetKobo = parseMoney(target); const savedKobo = parseMoney(saved); if (!name.trim() || !targetKobo || targetKobo < 0 || savedKobo === null || savedKobo < 0 || (date && !validDate(date))) return task.setError('Enter a name, positive target, valid saved amount and optional YYYY-MM-DD date.'); task.run(() => controller.dispatch({ type: 'goal.save', value: { id: goal?.id || uid(), name: name.trim(), targetKobo, savedKobo, targetDate: date || null } }), onClose); }
  return <Sheet title={goal ? 'A little closer' : 'Something to save for'} subtitle="Track a goal without changing your transaction balance." visible onClose={onClose}><Field label="Goal name" value={name} onChangeText={setName} maxLength={80} placeholder="e.g. A rainy-day fund" /><Field label="Target · NGN" value={target} onChangeText={setTarget} keyboardType="decimal-pad" /><Field label="Already saved · NGN" value={saved} onChangeText={setSaved} keyboardType="decimal-pad" hint="Update this amount as you set money aside." /><Field label="Target date (optional)" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />{!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}<Button label="Save goal" onPress={save} busy={task.busy} />{goal && <Button label="Remove goal" variant="danger" onPress={() => confirmDelete('Remove this goal?', () => task.run(() => controller.dispatch({ type: 'goal.delete', id: goal.id }), onClose))} />}</Sheet>;
}
