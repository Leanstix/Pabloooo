import type { FinanceState, Transaction } from '../domain/types';
import type { Sheet } from './archive';
import { dateCell, moneyCell, textCell } from './cells';
import { categoryLabels, sumKobo } from './model';
export function recurringSheet(
  state: FinanceState,
  transactions: Transaction[],
  context: string,
): Sheet {
  return {
    name: 'Recurring',
    widths: [29, 13, 22, 16, 24, 14, 34, 22, 26, 28, 27, 27],
    headerRow: 4,
    merges: ['A1:L1', 'A2:L2', 'A3:L3'],
    rows: [
      [textCell('RECURRING  /  Schedules and confirmations', 1)],
      [textCell(context, 3)],
      [
        textCell(
          'Configured amount is per occurrence, never a monthly estimate. Recorded amounts below come only from linked, confirmed transactions in the report range.',
          3,
        ),
      ],
      [
        'Schedule name',
        'Kind',
        'Per occurrence · NGN',
        'Frequency',
        'Next due · UTC date',
        'Status',
        'Category path',
        'Recorded occurrences',
        'Recorded amount · NGN',
        'Rule ID',
        'Next due · ISO',
        'Updated · ISO',
      ].map((label) => textCell(label, 2)),
      ...state.recurringRules.map((rule) => {
        const linked = transactions.filter((tx) => tx.recurringId === rule.id);
        return [
          textCell(rule.name),
          textCell(rule.kind),
          moneyCell(rule.amountKobo),
          textCell(rule.frequency),
          dateCell(rule.nextDueDate),
          textCell(rule.active ? 'Active' : 'Paused'),
          textCell(categoryLabels(rule.categoryId, state.categories).full),
          { value: linked.length },
          moneyCell(sumKobo(linked)),
          textCell(rule.id),
          textCell(rule.nextDueDate),
          textCell(rule.updatedAt),
        ];
      }),
    ],
  };
}
