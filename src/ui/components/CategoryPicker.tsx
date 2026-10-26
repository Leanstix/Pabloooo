import React from 'react';
import { View } from 'react-native';
import type { Category, EntryKind } from '../../domain/types';
import { Chip } from './Chip';
import { Text } from './Text';
export function CategoryPicker({ categories, kind, value, onChange }: { categories: Category[]; kind: EntryKind; value: string; onChange: (id: string) => void }) {
  const available = categories.filter(c => c.kind === kind && !c.archived);
  return <View style={{ gap: 9 }}><Text size={13} weight="600">Category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{available.map(c => <Chip key={c.id} label={c.parentId ? `${categories.find(p => p.id === c.parentId)?.name || ''} / ${c.name}` : c.name} active={value === c.id} onPress={() => onChange(c.id)} />)}</View>{!available.length && <Text muted size={13}>Create an {kind} category in More → Categories first.</Text>}</View>;
}
