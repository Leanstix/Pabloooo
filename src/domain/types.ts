/** All monetary values are safe integer kobo. No floating-point currency storage. */
export type EntryKind = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface Category {
  id: string; name: string; kind: EntryKind; parentId: string | null;
  color: string; icon: string; archived: boolean; createdAt: string; updatedAt: string;
}
export interface Transaction {
  id: string; kind: EntryKind; amountKobo: number; categoryId: string;
  note: string; merchant: string; occurredAt: string;
  recurringId: string | null; createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface Budget {
  id: string; categoryId: string; limitKobo: number; cycleKey: string;
  createdAt: string; updatedAt: string;
}
export interface RecurringRule {
  id: string; name: string; kind: EntryKind; amountKobo: number; categoryId: string;
  frequency: Frequency; nextDueDate: string; active: boolean; createdAt: string; updatedAt: string;
}
export interface SavingsGoal {
  id: string; name: string; targetKobo: number; savedKobo: number;
  targetDate: string | null; createdAt: string; updatedAt: string;
}
export interface Settings {
  currency: 'NGN'; cycleStartDay: number; plannedIncomeKobo: number;
  theme: 'system' | 'light' | 'dark'; remindersEnabled: boolean;
  morningTime: string; eveningTime: string; onboardingComplete: boolean;
}
export interface FinanceState {
  schemaVersion: 1; revision: number; installationId: string;
  transactions: Transaction[]; categories: Category[]; budgets: Budget[];
  recurringRules: RecurringRule[]; goals: SavingsGoal[]; settings: Settings;
}
export interface DateRange { start: string; end: string }
export type TransactionInput = Omit<Transaction, 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type CategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>;
export type BudgetInput = Omit<Budget, 'createdAt' | 'updatedAt'>;
export type RecurringInput = Omit<RecurringRule, 'createdAt' | 'updatedAt'>;
export type GoalInput = Omit<SavingsGoal, 'createdAt' | 'updatedAt'>;
export type AppAction =
  | { type: 'transaction.save'; value: TransactionInput }
  | { type: 'transaction.delete'; id: string }
  | { type: 'transaction.restore'; id: string }
  | { type: 'category.save'; value: CategoryInput }
  | { type: 'category.archive'; id: string }
  | { type: 'budget.save'; value: BudgetInput }
  | { type: 'budget.delete'; id: string }
  | { type: 'recurring.save'; value: RecurringInput }
  | { type: 'recurring.delete'; id: string }
  | { type: 'recurring.confirm'; id: string; transactionId: string; occurredAt: string }
  | { type: 'goal.save'; value: GoalInput }
  | { type: 'goal.delete'; id: string }
  | { type: 'settings.update'; value: Partial<Settings> };
