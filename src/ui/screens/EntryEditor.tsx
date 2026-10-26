import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { AppController } from '../../app/contracts';
import type { EntryKind, Transaction } from '../../domain/types';
import { parseMoney, suggestCategory } from '../../domain';
import { Sheet } from '../components/Sheet';
import { Segmented } from '../components/Segmented';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { CategoryPicker } from '../components/CategoryPicker';
import { useTask } from '../hooks/useTask';
import { confirmDelete, today, uid, validDate } from '../utils';
import { useTheme } from '../theme/Theme';
export interface EntryDraft { kind?: EntryKind; amount?: string; transaction?: Transaction }
export function EntryEditor({ controller, draft, onClose }: { controller: AppController; draft: EntryDraft | null; onClose: () => void }) {
  const { colors } = useTheme(); const task = useTask();
  const [kind, setKind] = useState<EntryKind>('expense'); const [amount, setAmount] = useState('');
  const [categoryId, setCategory] = useState(''); const [note, setNote] = useState(''); const [merchant, setMerchant] = useState(''); const [date, setDate] = useState(today()); const [time, setTime] = useState('12:00');
  useEffect(() => { if (!draft) return; const tx = draft.transaction; setKind(tx?.kind || draft.kind || 'expense'); setAmount(tx ? (tx.amountKobo / 100).toFixed(2) : draft.amount || ''); setCategory(tx?.categoryId || ''); setNote(tx?.note || ''); setMerchant(tx?.merchant || ''); setDate(tx?.occurredAt.slice(0, 10) || today()); setTime(tx ? new Date(tx.occurredAt).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)); task.setError(''); }, [draft]);
  const suggested = suggestCategory(controller.state, { kind, note, merchant });
  function save() {
    const amountKobo = parseMoney(amount);
    if (!amountKobo || amountKobo < 0) return task.setError('Enter an amount greater than ₦0, with at most two decimal places.');
    if (!categoryId) return task.setError('Choose a category for this entry.');
    if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return task.setError('Use a valid date (YYYY-MM-DD) and time (HH:MM).');
    task.run(() => controller.dispatch({ type: 'transaction.save', value: { id: draft?.transaction?.id || uid(), kind, amountKobo, categoryId, note: note.trim(), merchant: merchant.trim(), occurredAt: new Date(`${date}T${time}:00`).toISOString(), recurringId: draft?.transaction?.recurringId || null } }), onClose);
  }
  return <Sheet title={draft?.transaction ? 'Entry details' : 'A little check-in'} subtitle={draft?.transaction ? 'Review or edit this transaction' : 'Every entry brings a little more clarity.'} visible={!!draft} onClose={onClose}><Segmented value={kind} onChange={value => { setKind(value); setCategory(''); }} options={[{ value: 'expense', label: 'Money out' }, { value: 'income', label: 'Money in' }]} /><Field label="Amount · NGN" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" style={{ fontSize: 34, fontWeight: '700', minHeight: 76 }} /><Field label="Merchant or source" value={merchant} onChangeText={setMerchant} placeholder={kind === 'expense' ? 'e.g. Grocery store' : 'e.g. Salary'} maxLength={120} /><CategoryPicker categories={controller.state.categories} kind={kind} value={categoryId} onChange={setCategory} />{suggested && suggested !== categoryId && <Button variant="secondary" icon="sparkles-outline" label={`Suggested: ${controller.state.categories.find(c => c.id === suggested)?.name || 'Category'}`} onPress={() => setCategory(suggested)} />}<View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" /></View><View style={{ width: 100 }}><Field label="Time" value={time} onChangeText={setTime} placeholder="HH:MM" keyboardType="numbers-and-punctuation" /></View></View><Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="What was it for?" maxLength={500} multiline />{task.error ? <Text accessibilityRole="alert" color={colors.negative}>{task.error}</Text> : null}<Button label={draft?.transaction ? 'Save changes' : 'Save entry'} icon="checkmark" onPress={save} busy={task.busy} />{draft?.transaction && <Button label="Delete entry" variant="danger" icon="trash-outline" onPress={() => confirmDelete('Delete this entry?', () => task.run(() => controller.dispatch({ type: 'transaction.delete', id: draft.transaction!.id }), onClose), 'This entry will be removed from your totals.')} />}</Sheet>;
}
