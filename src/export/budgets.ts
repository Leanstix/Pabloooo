import { categoryIds, cycleKey, cycleRange } from '../domain';
import type { FinanceState } from '../domain/types';
import type { Sheet } from './archive';
import { Cell, moneyCell, textCell } from './cells';
import { addKobo, categoryLabels, selectedTransactions, sumKobo } from './model';
export function budgetSheet(state: FinanceState, generatedAt: string): Sheet {
  const range = cycleRange(generatedAt, state.settings.cycleStartDay);
  const key = cycleKey(generatedAt, state.settings.cycleStartDay);
  const transactions = selectedTransactions(state, range).filter(tx => tx.kind === 'expense');
  const budgets = state.budgets.filter(budget => budget.cycleKey === key);
  return {
    name: 'Budget vs Actual', widths: [35, 23, 23, 23, 19, 22, 29, 20], headerRow: 4, merges: ['A1:H1', 'A2:H2', 'A3:H3'],
    rows: [
      [textCell('BUDGET VS ACTUAL  /  Current cycle', 1)],
      [textCell(`Current cycle: ${range.start} ≤ timestamp < ${range.end} · configured start day ${state.settings.cycleStartDay} · cycle key ${key}`, 3)],
      [textCell('Independent of the report range. Actual = confirmed expenses including descendant categories. Overlapping parent/child budgets are separate views; do not sum them.', 3)],
      ['Category path', 'Budget · NGN', 'Actual · NGN', 'Remaining · NGN', 'Budget used', 'Status', 'Budget ID', 'Cycle key'].map(label => textCell(label, 2)),
      ...budgets.map((budget, index) => {
        const ids = new Set(categoryIds(state, budget.categoryId));
        const actual = sumKobo(transactions.filter(tx => ids.has(tx.categoryId)));
        const remaining = addKobo(budget.limitKobo, -actual);
        const ratio: Cell = budget.limitKobo > 0 ? { value: actual / budget.limitKobo, style: 6, formula: `C${index + 5}/B${index + 5}` } : textCell('');
        return [textCell(categoryLabels(budget.categoryId, state.categories).full), moneyCell(budget.limitKobo), moneyCell(actual), { ...moneyCell(remaining), formula: `B${index + 5}-C${index + 5}` }, ratio, textCell(actual > budget.limitKobo ? 'Over budget' : actual === budget.limitKobo ? 'At limit' : 'Within budget'), textCell(budget.id), textCell(budget.cycleKey)];
      }),
    ],
  };
}
