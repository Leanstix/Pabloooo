import type { FinanceState, Transaction } from '../domain/types';
import type { Sheet } from './archive';
import type { CategoryTotal } from './categories';
import { Cell, moneyCell, textCell } from './cells';
import { addKobo, categoryLabels, sumKobo } from './model';
export function overviewSheet(
  state: FinanceState,
  rows: Transaction[],
  totals: CategoryTotal[],
  context: string,
  generatedAt: string,
): Sheet {
  const income = sumKobo(rows.filter((row) => row.kind === 'income'));
  const expense = sumKobo(rows.filter((row) => row.kind === 'expense'));
  const end = Math.max(rows.length + 4, 5);
  const formula = (kind: string) =>
    `SUMIF(Transactions!B5:B${end},"${kind}",Transactions!C5:C${end})`;
  const metric = (value: number, f: string): Cell => ({ ...moneyCell(value, 7), formula: f });
  return {
    name: 'Overview',
    widths: [39, 28, 30, 28, 24, 24],
    merges: [
      'A1:F1',
      'A2:F2',
      'A3:F3',
      'A10:F10',
      'A19:F19',
      'A20:F20',
      'A21:F21',
      'A22:F22',
      'A23:F23',
      'A24:F24',
      'A25:F25',
      'A26:F26',
    ],
    rows: [
      [textCell('PABLOOOO  /  Money, made clear', 1)],
      [textCell(context, 3)],
      [
        textCell(
          `Generated ${generatedAt} · NGN · ${rows.length} active transactions · state revision ${state.revision}`,
          3,
        ),
      ],
      [textCell('RECORDED CASH FLOW', 8), textCell('Amount · NGN', 8)],
      [textCell('Income'), metric(income, formula('income'))],
      [textCell('Spending'), metric(expense, formula('expense'))],
      [textCell('Net balance'), metric(addKobo(income, -expense), 'B5-B6')],
      [
        textCell('Income retained'),
        income > 0
          ? { value: (income - expense) / income, style: 6, formula: '(B5-B6)/B5' }
          : textCell('No recorded income', 3),
      ],
      [],
      [textCell('BIGGEST SPENDING CATEGORIES', 8)],
      [textCell('Category', 2), textCell('Recorded · NGN', 2), textCell('% of recorded income', 2)],
      ...Array.from({ length: 5 }, (_, i) => {
        const total = totals.filter((row) => row.kind === 'expense')[i];
        return total
          ? [
              textCell(categoryLabels(total.id, state.categories).full),
              moneyCell(total.amount),
              income > 0
                ? { value: total.amount / income, style: 6, formula: `B${i + 12}/$B$5` }
                : textCell(''),
            ]
          : [textCell(i === 0 ? 'No spending in this range' : '', 3)];
      }),
      [],
      [
        textCell('EXPLORE', 8),
        { ...textCell('Transactions →', 9), link: "'Transactions'!A1" },
        { ...textCell('Categories →', 9), link: "'Categories'!A1" },
        { ...textCell('Recurring →', 9), link: "'Recurring'!A1" },
        { ...textCell('Budget vs Actual →', 9), link: "'Budget vs Actual'!A1" },
      ],
      [textCell('HOW TO READ THIS REPORT', 8)],
      [
        textCell(
          'Recorded amounts are confirmed, active transactions in the selected range. Deleted records are excluded. This report is not a full backup.',
          3,
        ),
      ],
      [
        textCell(
          'Net balance = recorded income − recorded spending in this range. It is not an opening balance or a bank account balance.',
          3,
        ),
      ],
      [
        textCell(
          'Category percentages use recorded income as denominator, not planned income. Direct allocations avoid counting parent and child totals twice.',
          3,
        ),
      ],
      [
        textCell(
          'Recurring rules are configured schedules, not assumed payments. Only confirmed transactions appear in recorded cash flow.',
          3,
        ),
      ],
      [
        textCell(
          'Budget vs Actual uses the current configured cycle, independently of this report range. Parent-category budgets include descendant categories.',
          3,
        ),
      ],
      [
        textCell(
          'Dates are UTC in Excel; original timestamps remain in Transactions. All ranges include the start instant and exclude the end instant.',
          3,
        ),
      ],
      [
        textCell(
          'Currency is stored and aggregated as checked integer kobo; Excel displays NGN decimals. Formulas include cached results for offline readers.',
          3,
        ),
      ],
    ],
  };
}
