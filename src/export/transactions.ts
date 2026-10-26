import type { FinanceState, Transaction } from '../domain/types';
import type { Sheet } from './archive';
import { dateCell, moneyCell, textCell } from './cells';
import { categoryLabels } from './model';
export function transactionSheet(state: FinanceState, rows: Transaction[], context: string): Sheet {
  return {
    name: 'Transactions',
    widths: [26, 14, 21, 25, 29, 35, 23, 29, 38, 28, 28, 28, 28, 15],
    headerRow: 4,
    merges: ['A1:N1', 'A2:N2', 'A3:N3'],
    rows: [
      [textCell('TRANSACTIONS  /  Recorded activity', 1)],
      [textCell(context, 3)],
      [
        textCell(
          'Active records only. NGN amounts are positive; Kind determines income or expense. Exact kobo retained in column G.',
          3,
        ),
      ],
      [
        'Transaction ID',
        'Kind',
        'Amount · NGN',
        'Parent category',
        'Child category',
        'Category path',
        'Amount · integer kobo',
        'Occurred · UTC date',
        'Note',
        'Merchant / source',
        'Timestamp · ISO',
        'Created · ISO',
        'Updated · ISO',
        'Recurrence ID',
      ].map((label) => textCell(label, 2)),
      ...rows.map((tx) => {
        const label = categoryLabels(tx.categoryId, state.categories);
        return [
          textCell(tx.id),
          textCell(tx.kind),
          moneyCell(tx.amountKobo),
          textCell(label.parent),
          textCell(label.child),
          textCell(label.full),
          { value: tx.amountKobo },
          dateCell(tx.occurredAt),
          textCell(tx.note),
          textCell(tx.merchant),
          textCell(tx.occurredAt),
          textCell(tx.createdAt),
          textCell(tx.updatedAt),
          textCell(tx.recurringId ?? ''),
        ];
      }),
    ],
  };
}
