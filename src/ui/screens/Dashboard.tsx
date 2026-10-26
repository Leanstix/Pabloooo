import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppController } from '../../app/contracts';
import { cycleRange, formatMoney, summarize, plan } from '../../domain';
import { Screen } from '../components/Screen';
import { BalanceCard } from '../components/BalanceCard';
import { QuickActions } from '../components/QuickActions';
import { Section } from '../components/Section';
import { Card } from '../components/Card';
import { Text } from '../components/Text';
import { Enter } from '../components/Enter';
import { EmptyState } from '../components/EmptyState';
import { TransactionRow } from '../components/TransactionRow';
import { useTheme } from '../theme/Theme';
import { friendlyDate, today } from '../utils';
import type { EntryDraft } from './EntryEditor';
export function Dashboard({ controller, add, calculator, activity, planner }: { controller: AppController; add: (draft: EntryDraft) => void; calculator: () => void; activity: () => void; planner: () => void }) {
  const { state } = controller; const { colors } = useTheme();
  const range = cycleRange(today(), state.settings.cycleStartDay); const totals = summarize(state, range); const projection = plan(state, today());
  const entries = state.transactions.filter(t => !t.deletedAt).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 4);
  return <Screen eyebrow="Your money, a little clearer" title="Hello, you." action={<View style={{ width: 46, height: 46, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="leaf" size={23} color={colors.accentInk} /></View>}><Enter delay={40}><BalanceCard balance={totals.balanceKobo} income={totals.incomeKobo} spending={totals.expenseKobo} period={`${friendlyDate(range.start)} – ${friendlyDate(new Date(new Date(range.end).getTime() - 1).toISOString())}`} /></Enter><Enter delay={90}><QuickActions expense={() => add({ kind: 'expense' })} income={() => add({ kind: 'income' })} calculator={calculator} /></Enter><Enter delay={140}><Card style={{ backgroundColor: colors.raised, borderWidth: 0 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ionicons name="sunny-outline" size={26} color={colors.positive} /><View style={{ flex: 1, gap: 3 }}><Text weight="600">A little room to breathe</Text><Text muted size={12}>{state.settings.plannedIncomeKobo > 0 ? `${formatMoney(projection.dailyAvailableKobo)} available per day · ${projection.daysRemaining} days left` : 'Set your expected income to find your daily spending room.'}</Text></View></View><Section title="Your next move" action="Plan ahead" onPress={planner} detail={projection.remainingKobo < 0 ? 'Your current plan is over budget.' : 'Small choices, steadier days.'} /></Card></Enter><View style={{ gap: 12 }}><Section title="Recent activity" action="See all" onPress={activity} /><Card style={{ paddingVertical: 8 }}>{entries.length ? entries.map(item => <TransactionRow key={item.id} item={item} category={state.categories.find(c => c.id === item.categoryId)} onPress={() => add({ transaction: item })} />) : <EmptyState title="Start with one entry" body="A coffee, a payday, a little grocery run. Your money story starts here." action="Add your first entry" onPress={() => add({ kind: 'expense' })} />}</Card></View><Text size={11} muted style={{ textAlign: 'center', letterSpacing: .5 }}>PABLOOOO · MADE FOR YOUR EVERYDAY</Text></Screen>;
}
