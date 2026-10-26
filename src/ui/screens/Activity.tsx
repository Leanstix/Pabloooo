import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { AppController } from '../../app/contracts';
import { Screen } from '../components/Screen';
import { Field } from '../components/Field';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { EmptyState } from '../components/EmptyState';
import { TransactionRow } from '../components/TransactionRow';
import type { EntryDraft } from './EntryEditor';
export function Activity({
  controller,
  add,
}: {
  controller: AppController;
  add: (draft: EntryDraft) => void;
}) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(60);
  const { state } = controller;
  const rows = state.transactions
    .filter(
      (t) =>
        !t.deletedAt &&
        (kind === 'all' || t.kind === kind) &&
        (category === 'all' || t.categoryId === category) &&
        `${t.note} ${t.merchant} ${state.categories.find((c) => c.id === t.categoryId)?.name || ''} ${(t.amountKobo / 100).toFixed(2)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return (
    <Screen
      eyebrow="The everyday ledger"
      title="Activity"
      subtitle="A clear view of every little thing."
      action={<Button label="Add" icon="add" onPress={() => add({})} />}
    >
      <Field
        label="Search your entries"
        placeholder="Merchant, note, category or amount"
        value={search}
        onChangeText={setSearch}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'All entries', value: 'all' },
          { label: 'Money out', value: 'expense' },
          { label: 'Money in', value: 'income' },
        ].map((x) => (
          <Chip
            key={x.value}
            label={x.label}
            active={kind === x.value}
            onPress={() => {
              setKind(x.value);
              setCategory('all');
            }}
          />
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip
          label="All categories"
          active={category === 'all'}
          onPress={() => setCategory('all')}
        />
        {state.categories
          .filter((c) => !c.archived && (kind === 'all' || c.kind === kind))
          .map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
      </ScrollView>
      <Text muted size={12}>
        {rows.length} {rows.length === 1 ? 'entry' : 'entries'} · newest first
      </Text>
      <Card style={{ paddingVertical: 8, gap: 0 }}>
        {rows.length ? (
          rows
            .slice(0, limit)
            .map((item) => (
              <TransactionRow
                key={item.id}
                item={item}
                category={state.categories.find((c) => c.id === item.categoryId)}
                onPress={() => add({ transaction: item })}
              />
            ))
        ) : (
          <EmptyState
            title={search ? 'No matches this time' : 'Nothing here yet'}
            body={
              search
                ? 'Try a different search or choose another filter.'
                : 'Your saved entries will appear here.'
            }
            icon="receipt-outline"
          />
        )}
        {rows.length > limit && (
          <Button label="Show more entries" variant="ghost" onPress={() => setLimit(limit + 60)} />
        )}
      </Card>
    </Screen>
  );
}
