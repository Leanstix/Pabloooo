import type { AppAction, FinanceState, Category } from './types';
import { dateOnly, nextDueDate, timestamp, cycleKey } from './dates';
import { validateFinanceState } from './validation';

function required<T extends { id: string }>(items: T[], id: string, label: string): T {
  const item = items.find(value => value.id === id);
  if (!item) throw new Error(`${label} does not exist.`);
  return item;
}
function activeCategory(state: FinanceState, id: string, kind?: string): Category {
  const category = required(state.categories, id, 'Category');
  if (category.archived || (category.parentId && required(state.categories, category.parentId, 'Parent category').archived)) throw new Error('Choose an active category.');
  if (kind && category.kind !== kind) throw new Error('Category does not match the entry type.');
  return category;
}
function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some(row => row.id === item.id) ? items.map(row => row.id === item.id ? item : row) : [...items, item];
}
/** Every accepted mutation is immutable, validated, and advances exactly one revision. */
export function reduceFinance(state: FinanceState, action: AppAction, now: Date | string = new Date()): FinanceState {
  const at = timestamp(now);
  let next: FinanceState;
  switch (action.type) {
    case 'transaction.save': {
      const old = state.transactions.find(row => row.id === action.value.id);
      if (old?.deletedAt) throw new Error('Restore the transaction before editing.');
      if (!old || old.categoryId !== action.value.categoryId || old.kind !== action.value.kind) activeCategory(state, action.value.categoryId, action.value.kind);
      next = { ...state, transactions: upsert(state.transactions, { ...action.value, createdAt: old?.createdAt ?? at, updatedAt: at, deletedAt: null }) };
      break;
    }
    case 'transaction.delete': {
      const old = required(state.transactions, action.id, 'Transaction');
      if (old.deletedAt) return state;
      next = { ...state, transactions: state.transactions.map(row => row.id === action.id ? { ...row, deletedAt: at, updatedAt: at } : row) };
      break;
    }
    case 'transaction.restore': {
      const old = required(state.transactions, action.id, 'Transaction');
      if (!old.deletedAt) return state;
      next = { ...state, transactions: state.transactions.map(row => row.id === action.id ? { ...row, deletedAt: null, updatedAt: at } : row) };
      break;
    }
    case 'category.save': {
      const value = action.value;
      const old = state.categories.find(row => row.id === value.id);
      if (state.categories.some(row => row.id !== value.id && row.kind === value.kind && row.parentId === value.parentId && row.name.trim().toLocaleLowerCase() === value.name.trim().toLocaleLowerCase())) throw new Error('A category with this name already exists here.');
      if (old && old.kind !== value.kind && (state.transactions.some(row => row.categoryId === old.id) || state.recurringRules.some(row => row.categoryId === old.id) || state.budgets.some(row => row.categoryId === old.id) || state.categories.some(row => row.parentId === old.id))) throw new Error('A referenced category cannot change type.');
      if (value.parentId) activeCategory(state, value.parentId, value.kind);
      const categories = upsert(state.categories, { ...value, name: value.name.trim(), createdAt: old?.createdAt ?? at, updatedAt: at });
      if (value.archived) {
        const ids = new Set([value.id, ...categories.filter(row => row.parentId === value.id).map(row => row.id)]);
        next = { ...state, categories: categories.map(row => ids.has(row.id) ? { ...row, archived: true, updatedAt: at } : row), recurringRules: state.recurringRules.map(row => ids.has(row.categoryId) ? { ...row, active: false, updatedAt: at } : row) };
      } else next = { ...state, categories };
      break;
    }
    case 'category.archive': {
      const old = required(state.categories, action.id, 'Category');
      if (old.archived) return state;
      const ids = new Set([action.id, ...state.categories.filter(row => row.parentId === action.id).map(row => row.id)]);
      next = { ...state, categories: state.categories.map(row => ids.has(row.id) ? { ...row, archived: true, updatedAt: at } : row), recurringRules: state.recurringRules.map(row => ids.has(row.categoryId) ? { ...row, active: false, updatedAt: at } : row) };
      break;
    }
    case 'budget.save': {
      const old = state.budgets.find(row => row.id === action.value.id);
      activeCategory(state, action.value.categoryId, 'expense');
      if ((!old || old.cycleKey !== action.value.cycleKey) && cycleKey(action.value.cycleKey, state.settings.cycleStartDay) !== action.value.cycleKey) throw new Error('Budget key must be the start of a cycle.');
      next = { ...state, budgets: upsert(state.budgets, { ...action.value, createdAt: old?.createdAt ?? at, updatedAt: at }) };
      break;
    }
    case 'budget.delete':
      required(state.budgets, action.id, 'Budget');
      next = { ...state, budgets: state.budgets.filter(row => row.id !== action.id) }; break;
    case 'recurring.save': {
      const old = state.recurringRules.find(row => row.id === action.value.id);
      if (action.value.active || !old || old.categoryId !== action.value.categoryId) activeCategory(state, action.value.categoryId, action.value.kind);
      next = { ...state, recurringRules: upsert(state.recurringRules, { ...action.value, createdAt: old?.createdAt ?? at, updatedAt: at }) }; break;
    }
    case 'recurring.delete':
      required(state.recurringRules, action.id, 'Recurring rule');
      next = { ...state, recurringRules: state.recurringRules.filter(row => row.id !== action.id), transactions: state.transactions.map(row => row.recurringId === action.id ? { ...row, recurringId: null, updatedAt: at } : row) }; break;
    case 'recurring.confirm': {
      const rule = required(state.recurringRules, action.id, 'Recurring rule');
      const existing = state.transactions.find(row => row.id === action.transactionId);
      if (existing) {
        if (existing.recurringId === rule.id) return state;
        throw new Error('Transaction ID is already in use.');
      }
      if (!rule.active) throw new Error('Recurring rule is inactive.');
      activeCategory(state, rule.categoryId, rule.kind);
      if (dateOnly(action.occurredAt) < rule.nextDueDate) throw new Error('This occurrence is not due yet.');
      const due = nextDueDate(rule.nextDueDate, rule.frequency);
      next = {
        ...state,
        transactions: [...state.transactions, { id: action.transactionId, kind: rule.kind, amountKobo: rule.amountKobo, categoryId: rule.categoryId, note: rule.name, merchant: '', occurredAt: action.occurredAt, recurringId: rule.id, createdAt: at, updatedAt: at, deletedAt: null }],
        recurringRules: state.recurringRules.map(row => row.id === rule.id ? { ...row, nextDueDate: due, updatedAt: at } : row),
      }; break;
    }
    case 'goal.save': {
      const old = state.goals.find(row => row.id === action.value.id);
      next = { ...state, goals: upsert(state.goals, { ...action.value, createdAt: old?.createdAt ?? at, updatedAt: at }) }; break;
    }
    case 'goal.delete':
      required(state.goals, action.id, 'Goal');
      next = { ...state, goals: state.goals.filter(row => row.id !== action.id) }; break;
    case 'settings.update':
      next = { ...state, settings: { ...state.settings, ...action.value } }; break;
    default: throw new Error('Unknown action.');
  }
  if (!Number.isSafeInteger(state.revision + 1)) throw new Error('Revision limit reached.');
  return validateFinanceState({ ...next, revision: state.revision + 1 });
}
