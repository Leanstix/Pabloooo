import React, { useState } from 'react';
import { View } from 'react-native';
import type { AppController } from '../../app/contracts';
import type { Category, EntryKind } from '../../domain/types';
import { Sheet } from '../components/Sheet';
import { Field } from '../components/Field';
import { Segmented } from '../components/Segmented';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { ColorPicker, categoryColors } from '../components/ColorPicker';
import { useTask } from '../hooks/useTask';
import { uid } from '../utils';
export function CategoryEditor({ controller, category, onClose }: { controller: AppController; category?: Category; onClose: () => void }) {
  const [name, setName] = useState(category?.name || ''); const [kind, setKind] = useState<EntryKind>(category?.kind || 'expense'); const [parentId, setParentId] = useState<string | null>(category?.parentId || null); const [color, setColor] = useState(category?.color || categoryColors[0]!); const task = useTask();
  function save() { if (!name.trim()) return task.setError('Give this category a name.'); task.run(() => controller.dispatch({ type: 'category.save', value: { id: category?.id || uid(), name: name.trim(), kind, parentId, color, icon: category?.icon || (kind === 'expense' ? 'pricetag-outline' : 'wallet-outline'), archived: false } }), onClose); }
  return <Sheet visible title={category ? 'Edit category' : 'Make it your own'} subtitle="Organize your money in a way that feels natural." onClose={onClose}><Field label="Category name" value={name} onChangeText={setName} maxLength={60} placeholder="e.g. Weekend treats" /><Segmented value={kind} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} onChange={value => { setKind(value); setParentId(null); }} /><Text size={13} weight="600">Parent category</Text><View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><Chip label="None · top level" active={!parentId} onPress={() => setParentId(null)} />{controller.state.categories.filter(c => !c.archived && !c.parentId && c.kind === kind && c.id !== category?.id).map(c => <Chip key={c.id} label={c.name} active={c.id === parentId} onPress={() => setParentId(c.id)} />)}</View><ColorPicker value={color} onChange={setColor} />{!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}<Button label="Save category" onPress={save} busy={task.busy} /></Sheet>;
}
