import type { DateRange, FinanceState } from '../domain/types';
import { encodeWorkbook } from './archive';
import { budgetSheet } from './budgets';
import { categorySheet, categoryTotals } from './categories';
import { selectedTransactions, sumKobo, validateState } from './model';
import { overviewSheet } from './overview';
import { recurringSheet } from './recurring';
import { transactionSheet } from './transactions';

/** Generate a real, self-contained XLSX archive entirely offline. Throws before sharing invalid data. */
export async function generateWorkbook(state: FinanceState, range?: DateRange): Promise<Uint8Array> {
  validateState(state);
  const generatedAt = new Date().toISOString();
  const transactions = selectedTransactions(state, range);
  const totals = categoryTotals(transactions);
  const income = sumKobo(transactions.filter(row => row.kind === 'income'));
  const context = range ? `Report range: ${range.start} ≤ timestamp < ${range.end} (start included; end excluded)` : 'Report range: All recorded history (active transactions)';
  return encodeWorkbook([
    overviewSheet(state, transactions, totals, context, generatedAt),
    transactionSheet(state, transactions, context),
    categorySheet(state, totals, income, context),
    recurringSheet(state, transactions, context),
    budgetSheet(state, generatedAt),
  ], generatedAt);
}
