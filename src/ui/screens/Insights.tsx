import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { AppController } from '../../app/contracts';
import { reportRange, summarize, chartSeries } from '../../domain';
import { Screen } from '../components/Screen';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { CashflowChart } from '../components/CashflowChart';
import { ReportSummary } from '../components/ReportSummary';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { useTask } from '../hooks/useTask';
import { friendlyDate, today, validDate } from '../utils';
type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export function Insights({ controller }: { controller: AppController }) {
  const [period, setPeriod] = useState<Period>('month'); const [anchor, setAnchor] = useState(today()); const [start, setStart] = useState(today().slice(0, 8) + '01'); const [end, setEnd] = useState(today()); const task = useTask();
  const customValid = validDate(start) && validDate(end) && start <= end;
  const customEnd = customValid ? new Date(`${end}T00:00:00`) : new Date(); customEnd.setDate(customEnd.getDate() + 1);
  const range = reportRange(period === 'custom' && !customValid ? 'month' : period, validDate(anchor) ? anchor : today(), period === 'custom' && customValid ? { start: new Date(`${start}T00:00:00`).toISOString(), end: customEnd.toISOString() } : undefined);
  const totals = summarize(controller.state, range); const points = chartSeries(controller.state, range, period === 'day' ? 'hour' : period === 'year' || period === 'quarter' || (new Date(range.end).getTime() - new Date(range.start).getTime()) > 95 * 86400000 ? 'month' : 'day');
  return <Screen eyebrow="Find your rhythm" title="Insights" subtitle="Your numbers, with a little perspective."><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{([{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'quarter', label: '3 months' }, { value: 'year', label: 'Year' }, { value: 'custom', label: 'Custom' }] as { value: Period; label: string }[]).map(item => <Chip key={item.value} label={item.label} active={period === item.value} onPress={() => setPeriod(item.value)} />)}</ScrollView>{period === 'custom' ? <View style={{ gap: 12 }}><Field label="From (inclusive)" value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" /><Field label="To (inclusive)" value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD" />{!customValid && <Text accessibilityRole="alert">Enter valid dates, with the end on or after the start.</Text>}</View> : <Field label="Date within period" value={anchor} onChangeText={setAnchor} placeholder="YYYY-MM-DD" error={!validDate(anchor) ? 'Use YYYY-MM-DD.' : undefined} />}<Text size={12} muted>{friendlyDate(range.start)} – {friendlyDate(new Date(new Date(range.end).getTime() - 1).toISOString())} · {totals.count} entries</Text><ReportSummary income={totals.incomeKobo} spending={totals.expenseKobo} balance={totals.balanceKobo} /><Card><Section title="Money in motion" detail={period === 'day' ? 'Hour by hour · local time' : 'Income and spending over this period'} /><CashflowChart points={points} hourly={period === 'day'} /></Card><Card><Section title="Where it went" detail="Spending by category · share of income" /><CategoryBreakdown state={controller.state} range={range} /></Card>{task.error ? <Text accessibilityRole="alert">{task.error}</Text> : null}<Button label="Export this report" icon="download-outline" variant="secondary" busy={task.busy} disabled={period === 'custom' ? !customValid : !validDate(anchor)} onPress={() => task.run(() => controller.exportSpreadsheet(range))} /></Screen>;
}
