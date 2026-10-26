import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { AppController } from '../../app/contracts';
import type { RecurringRule } from '../../domain/types';
import { formatMoney } from '../../domain';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { EmptyState } from '../components/EmptyState';
import { RecurringEditor } from './RecurringEditor';
import { useTask } from '../hooks/useTask';
import { today, uid } from '../utils';
import { useTheme } from '../theme/Theme';
export function Recurring({ controller }: { controller: AppController }) {
  const [editor, setEditor] = useState<RecurringRule | 'new' | null>(null); const task = useTask(); const { colors } = useTheme();
  function confirm(rule: RecurringRule) { Alert.alert(`Record ${rule.name}?`, `Add ${formatMoney(rule.amountKobo)} to your ${rule.kind === 'expense' ? 'expenses' : 'income'} and move the due date forward.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Record payment', onPress: () => task.run(() => controller.dispatch({ type: 'recurring.confirm', id: rule.id, transactionId: uid(), occurredAt: new Date().toISOString() })) }]); }
  return <><Screen title="The regular things" subtitle="Subscriptions, bills and steady income." action={<Button label="New" icon="add" onPress={() => setEditor('new')} />}><Text size={13} muted>Schedules don’t change your balance until you confirm a payment.</Text>{controller.state.recurringRules.length ? [...controller.state.recurringRules].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).map(rule => <Card key={rule.id}><View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}><View style={{ flex: 1, gap: 4 }}><Text weight="700" size={18}>{rule.name}</Text><Text size={12} muted>{rule.frequency} · {rule.kind} · {rule.active ? `due ${rule.nextDueDate}` : 'paused'}</Text></View><Text weight="700">{formatMoney(rule.amountKobo)}</Text></View>{rule.active && rule.nextDueDate <= today() && <Text size={12} color={colors.negative}>Ready to check in</Text>}<View style={{ flexDirection: 'row', gap: 8 }}><Button label="Edit" variant="secondary" onPress={() => setEditor(rule)} style={{ flex: 1 }} /><Button label={rule.active ? 'Pause' : 'Resume'} variant="secondary" onPress={() => task.run(() => controller.dispatch({ type: 'recurring.save', value: { ...rule, active: !rule.active } }))} style={{ flex: 1 }} /></View>{rule.active && <Button label={rule.nextDueDate <= today() ? "Record payment" : "Not due yet"} disabled={rule.nextDueDate > today()} icon="checkmark" onPress={() => confirm(rule)} busy={task.busy} />}</Card>) : <Card><EmptyState title="Give your regulars a home" body="Track bills, subscriptions or income that repeats." action="Add a recurring entry" onPress={() => setEditor('new')} /></Card>}{task.error && <Text accessibilityRole="alert">{task.error}</Text>}</Screen>{editor && <RecurringEditor controller={controller} rule={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}</>;
}
