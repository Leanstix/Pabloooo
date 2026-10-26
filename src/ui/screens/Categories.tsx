import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppController } from '../../app/contracts';
import type { Category } from '../../domain/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Text } from '../components/Text';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryEditor } from './CategoryEditor';
import { useTheme } from '../theme/Theme';
import { useTask } from '../hooks/useTask';
export function Categories({ controller }: { controller: AppController }) {
  const { colors } = useTheme(); const [kind, setKind] = useState('expense'); const [editor, setEditor] = useState<Category | 'new' | null>(null); const task = useTask();
  return <><Screen title="Categories" subtitle="A place for everything." action={<Button label="New" icon="add" onPress={() => setEditor('new')} />}><View style={{ flexDirection: 'row', gap: 8 }}><Chip label="Expenses" active={kind === 'expense'} onPress={() => setKind('expense')} /><Chip label="Income" active={kind === 'income'} onPress={() => setKind('income')} /></View><Card>{controller.state.categories.filter(c => c.kind === kind && !c.archived).map(c => <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Pressable accessibilityRole="button" onPress={() => setEditor(c)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1, minHeight: 54 }}><CategoryIcon category={c} /><View style={{ flex: 1 }}><Text weight="600">{c.name}</Text><Text size={12} muted>{c.parentId ? `Within ${controller.state.categories.find(p => p.id === c.parentId)?.name}` : 'Top-level category'}</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Archive ${c.name}`} onPress={() => Alert.alert(`Archive ${c.name}?`, 'Existing entries stay in your reports. This category will no longer appear for new entries.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', onPress: () => task.run(() => controller.dispatch({ type: 'category.archive', id: c.id })) }])} style={{ height: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="archive-outline" size={20} color={colors.muted} /></Pressable></View>)}</Card>{controller.state.categories.some(c => c.archived && c.kind === kind) && <Card><Text weight="700">Archived categories</Text>{controller.state.categories.filter(c => c.archived && c.kind === kind).map(c => <Button key={c.id} label={`Restore ${c.name}`} variant="secondary" onPress={() => setEditor(c)} />)}</Card>}{task.error && <Text accessibilityRole="alert">{task.error}</Text>}</Screen>{editor && <CategoryEditor controller={controller} category={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}</>;
}
