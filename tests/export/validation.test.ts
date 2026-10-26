import { describe, expect, it } from 'vitest';
import { generateWorkbook } from '../../src/export';
import { addKobo, categoryLabels } from '../../src/export/model';
import { fixture } from './fixture';

describe('export fail-safe input handling', () => {
  it.each([NaN, Infinity, -1, 1.1, Number.MAX_SAFE_INTEGER + 1])('rejects invalid amount %s', async value => {
    const state = fixture(); state.transactions[0]!.amountKobo = value;
    await expect(generateWorkbook(state)).rejects.toThrow('safe integer kobo');
  });
  it('rejects an aggregate outside safe integer kobo before workbook creation', async () => {
    const state = fixture(); state.transactions[0]!.amountKobo = Number.MAX_SAFE_INTEGER;
    state.transactions.push({ ...state.transactions[0]!, id: 'another-income', amountKobo: 1 });
    await expect(generateWorkbook(state)).rejects.toThrow('safe integer kobo');
    expect(() => addKobo(Number.MIN_SAFE_INTEGER, -1)).toThrow();
  });
  it('rejects invalid timestamps and reversed or empty ranges', async () => {
    const state = fixture(); state.transactions[0]!.occurredAt = 'nonsense';
    await expect(generateWorkbook(state)).rejects.toThrow('timestamp');
    await expect(generateWorkbook(fixture(), { start: '2026-10-01', end: '2026-10-01' })).rejects.toThrow('precede');
    await expect(generateWorkbook(fixture(), { start: '2026-10-02', end: '2026-10-01' })).rejects.toThrow('precede');
  });
  it('rejects duplicate identifiers and category hierarchy cycles', async () => {
    const state = fixture(); state.transactions.push(state.transactions[0]!);
    await expect(generateWorkbook(state)).rejects.toThrow('duplicate');
    const categories = fixture().categories; categories[1]!.parentId = 'dining';
    expect(() => categoryLabels('dining', categories)).toThrow('cycle');
  });
  it('labels missing categories so active transaction money is retained', () => {
    expect(categoryLabels('missing', [])).toEqual({ parent: 'Unknown category', child: '', full: 'Unknown category' });
  });
});
