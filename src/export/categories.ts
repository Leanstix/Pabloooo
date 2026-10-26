import type { FinanceState, Transaction } from '../domain/types';
import type { Sheet } from './archive';
import { Cell, moneyCell, textCell } from './cells';
import { addKobo, categoryLabels } from './model';
export interface CategoryTotal { id: string; kind: 'income' | 'expense'; amount: number; count: number; }
export function categoryTotals(rows: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();
  for (const tx of rows) {
    const key = `${tx.kind}:${tx.categoryId}`;
    const total = totals.get(key) ?? { id: tx.categoryId, kind: tx.kind, amount: 0, count: 0 };
    total.amount = addKobo(total.amount, tx.amountKobo); total.count += 1; totals.set(key, total);
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
}
export function categorySheet(state: FinanceState, totals: CategoryTotal[], income: number, context: string): Sheet {
  return {
    name: 'Categories', widths: [27, 30, 14, 23, 21, 19, 30, 28], headerRow: 4, merges: ['A1:H1', 'A2:H2', 'A3:H3'],
    rows: [
      [textCell('CATEGORIES  /  Where money moved', 1)], [textCell(context, 3)],
      [textCell('Direct category allocations: each transaction counted once. Share = category amount / recorded income; blank when income is zero.', 3)],
      ['Parent category', 'Child category', 'Kind', 'Recorded · NGN', '% of recorded income', 'Transaction count', 'Category ID', 'Category path'].map(label => textCell(label, 2)),
      ...totals.map((total, index) => {
        const labels = categoryLabels(total.id, state.categories);
        const share: Cell = income > 0 ? { value: total.amount / income, style: 6, formula: `D${index + 5}/Overview!$B$5` } : textCell('');
        return [textCell(labels.parent), textCell(labels.child), textCell(total.kind), moneyCell(total.amount), share, { value: total.count }, textCell(total.id), textCell(labels.full)];
      }),
    ],
  };
}
