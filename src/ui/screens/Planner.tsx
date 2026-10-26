import React, { useState } from 'react';
import { View } from 'react-native';
import type { AppController } from '../../app/contracts';
import type { Budget, SavingsGoal } from '../../domain/types';
import { cycleKey, formatMoney, parseMoney, plan } from '../../domain';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { Section } from '../components/Section';
import { BudgetRow } from '../components/BudgetRow';
import { GoalCard } from '../components/GoalCard';
import { WhatIf } from '../components/WhatIf';
import { EmptyState } from '../components/EmptyState';
import { BudgetEditor } from './BudgetEditor';
import { GoalEditor } from './GoalEditor';
import { useTask } from '../hooks/useTask';
import { today } from '../utils';
export function Planner({ controller }: { controller: AppController }) {
  const { state } = controller; const projection = plan(state, today()); const task = useTask();
  const [income, setIncome] = useState(String(state.settings.plannedIncomeKobo / 100)); const [budget, setBudget] = useState<Budget | 'new' | null>(null); const [goal, setGoal] = useState<SavingsGoal | 'new' | null>(null);
  const budgets = state.budgets.filter(b => b.cycleKey === cycleKey(today(), state.settings.cycleStartDay));
  function saveIncome() { const value = parseMoney(income); if (value === null || value < 0) return task.setError('Enter a valid non-negative income amount.'); task.run(() => controller.dispatch({ type: 'settings.update', value: { plannedIncomeKobo: value } })); }
  return <><Screen eyebrow="Make room for what matters" title="Plan ahead" subtitle="A little intention goes a long way."><Card><Section title="This cycle’s plan" detail={`${projection.daysRemaining} days remaining`} /><Field label="Expected cycle income · NGN" value={income} onChangeText={setIncome} keyboardType="decimal-pad" /><Button label="Update plan" variant="secondary" onPress={saveIncome} busy={task.busy} />{!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}<View style={{ flexDirection: 'row', gap: 16 }}><View style={{ flex: 1, gap: 5 }}><Text size={12} muted>Room left</Text><Text weight="700" size={22}>{formatMoney(projection.remainingKobo)}</Text></View><View style={{ flex: 1, gap: 5 }}><Text size={12} muted>Per day</Text><Text weight="700" size={22}>{formatMoney(projection.dailyAvailableKobo)}</Text></View></View><Text size={12} muted>Recorded spending + unconfirmed cycle bills: {formatMoney(projection.projectedExpenseKobo)}.</Text></Card><View style={{ gap: 14 }}><Section title="Category budgets" action="Add" onPress={() => setBudget('new')} /><Card>{budgets.length ? budgets.map(b => <BudgetRow key={b.id} budget={b} state={state} range={projection.range} onPress={() => setBudget(b)} />) : <EmptyState title="Set a gentle boundary" body="Choose a spending limit for a category this cycle." action="Create a budget" onPress={() => setBudget('new')} />}</Card></View><View style={{ gap: 14 }}><Section title="Things worth saving for" action="Add" onPress={() => setGoal('new')} /><Card>{state.goals.length ? state.goals.map(g => <GoalCard key={g.id} goal={g} onPress={() => setGoal(g)} />) : <EmptyState title="What’s your next little dream?" body="A rainy-day fund or something just for you." action="Create a goal" onPress={() => setGoal('new')} />}</Card></View><WhatIf remaining={projection.remainingKobo} days={projection.daysRemaining} /></Screen>{budget && <BudgetEditor controller={controller} budget={budget === 'new' ? undefined : budget} onClose={() => setBudget(null)} />}{goal && <GoalEditor controller={controller} goal={goal === 'new' ? undefined : goal} onClose={() => setGoal(null)} />}</>;
}
