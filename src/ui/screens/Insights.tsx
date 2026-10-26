import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { AppController } from '../../app/contracts';
import { prepareReport } from '../report';
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
import { friendlyDate, today } from '../utils';
type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export function Insights({ controller }: { controller: AppController }) {
  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState(today());
  const [start, setStart] = useState(today().slice(0, 8) + '01');
  const [end, setEnd] = useState(today());
  const task = useTask();
  const report = prepareReport(controller.state, { period, anchor, start, end });
  return (
    <Screen
      eyebrow="Find your rhythm"
      title="Insights"
      subtitle="Your numbers, with a little perspective."
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {(
          [
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'quarter', label: '3 months' },
            { value: 'year', label: 'Year' },
            { value: 'custom', label: 'Custom' },
          ] as { value: Period; label: string }[]
        ).map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            active={period === item.value}
            onPress={() => setPeriod(item.value)}
          />
        ))}
      </ScrollView>
      {period === 'custom' ? (
        <View style={{ gap: 12 }}>
          <Field
            label="From (inclusive)"
            value={start}
            onChangeText={setStart}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="To (inclusive)"
            value={end}
            onChangeText={setEnd}
            placeholder="YYYY-MM-DD"
          />
        </View>
      ) : (
        <Field
          label="Date within period"
          value={anchor}
          onChangeText={setAnchor}
          placeholder="YYYY-MM-DD"
        />
      )}
      {report.ok ? (
        <>
          <Text size={12} muted>
            {friendlyDate(report.range.start)} –{' '}
            {friendlyDate(new Date(new Date(report.range.end).getTime() - 1).toISOString())} ·{' '}
            {report.totals.count} entries
          </Text>
          <ReportSummary
            income={report.totals.incomeKobo}
            spending={report.totals.expenseKobo}
            balance={report.totals.balanceKobo}
          />
          <Card>
            <Section
              title="Money in motion"
              detail={
                period === 'day'
                  ? 'Hour by hour · local time'
                  : 'Income and spending over this period'
              }
            />
            <CashflowChart points={report.points} hourly={period === 'day'} />
          </Card>
          <Card>
            <Section title="Where it went" detail="Spending by category · share of income" />
            <CategoryBreakdown state={controller.state} range={report.range} />
          </Card>
        </>
      ) : (
        <Card>
          <Text accessibilityRole="alert">{report.error}</Text>
          <Text size={12} muted>
            Your saved entries are unchanged. Adjust the dates above to continue.
          </Text>
        </Card>
      )}
      {task.error ? <Text accessibilityRole="alert">{task.error}</Text> : null}
      <Button
        label="Export this report"
        icon="download-outline"
        variant="secondary"
        busy={task.busy}
        disabled={!report.ok}
        onPress={() => {
          if (report.ok) task.run(() => controller.exportSpreadsheet(report.range));
        }}
      />
    </Screen>
  );
}
