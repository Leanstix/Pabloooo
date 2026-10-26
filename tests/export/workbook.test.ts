import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { strFromU8, unzipSync } from 'fflate';
import { generateWorkbook } from '../../src/export';
import { fixture, transaction } from './fixture';

async function read(state = fixture(), range?: { start: string; end: string }) {
  const bytes = await generateWorkbook(state, range);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  return { bytes, workbook, files: unzipSync(bytes) };
}
describe('offline XLSX export', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-26T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });
  it('opens with a real spreadsheet reader and exposes five deliberate sheets', async () => {
    const { workbook } = await read();
    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['Overview', 'Transactions', 'Categories', 'Recurring', 'Budget vs Actual']);
    const transactions = workbook.getWorksheet('Transactions')!;
    expect(transactions.views[0]).toMatchObject({ state: 'frozen', ySplit: 4, showGridLines: false });
    expect(transactions.autoFilter).toBe('A4:N7');
    expect(transactions.getColumn('I').width).toBe(38);
  });
  it('reconciles income, expenses, net and cached cross-sheet formulas', async () => {
    const { workbook } = await read();
    const overview = workbook.getWorksheet('Overview')!;
    expect(overview.getCell('B5').value).toEqual({ formula: 'SUMIF(Transactions!B5:B7,"income",Transactions!C5:C7)', result: 100000 });
    expect(overview.getCell('B6').result).toBe(2200);
    expect(overview.getCell('B7').value).toEqual({ formula: 'B5-B6', result: 97800 });
    expect(overview.getCell('B8').result).toBe(0.978);
  });
  it('writes amount, exact kobo, and dates as typed cells', async () => {
    const { workbook, files } = await read();
    const sheet = workbook.getWorksheet('Transactions')!;
    expect(typeof sheet.getCell('C6').value).toBe('number');
    expect(sheet.getCell('C6').value).toBe(1200.55);
    expect(sheet.getCell('G6').value).toBe(120055);
    expect(sheet.getCell('H6').value).toEqual(new Date('2026-10-01T12:00:00Z'));
    expect(sheet.getCell('K6').value).toBe('2026-10-01T12:00:00.000Z');
    expect(strFromU8(files['xl/worksheets/sheet2.xml']!)).toContain('<c r="C6" s="4" t="n"><v>1200.55</v></c>');
  });
  it('keeps formula-like notes literal and round-trips XML metacharacters and Unicode', async () => {
    const state = fixture();
    state.transactions[0]!.note = '=HYPERLINK("https://evil.invalid") & <tag> “₦” 😀\u0001';
    state.transactions[1]!.merchant = '+SUM(A1:A2)';
    state.transactions[2]!.note = '@cmd -1';
    const { workbook, files } = await read(state);
    const sheet = workbook.getWorksheet('Transactions')!;
    expect(sheet.getCell('I5').value).toBe('=HYPERLINK("https://evil.invalid") & <tag> “₦” 😀');
    expect(sheet.getCell('I5').type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell('J6').value).toBe('+SUM(A1:A2)');
    expect(sheet.getCell('I7').value).toBe('@cmd -1');
    expect(strFromU8(files['xl/worksheets/sheet2.xml']!)).not.toContain('<f>');
  });
  it('includes the start instant, excludes the end, and excludes tombstones', async () => {
    const state = fixture();
    state.transactions = [
      transaction('before', 'income', 100, 'salary', '2026-09-30T23:59:59.999Z'),
      transaction('start', 'income', 200, 'salary', '2026-10-01T00:00:00Z'),
      transaction('inside', 'expense', 50, 'food', '2026-10-01T23:59:59.999Z'),
      transaction('end', 'expense', 999, 'food', '2026-10-02T00:00:00Z'),
      { ...transaction('deleted', 'income', 5000, 'salary'), deletedAt: '2026-10-02T00:00:00Z' },
    ];
    const { workbook } = await read(state, { start: '2026-10-01T00:00:00Z', end: '2026-10-02T00:00:00Z' });
    const sheet = workbook.getWorksheet('Transactions')!;
    expect(sheet.rowCount).toBe(6);
    expect(sheet.getCell('A5').value).toBe('start');
    expect(sheet.getCell('A6').value).toBe('inside');
    expect(workbook.getWorksheet('Overview')!.getCell('B7').result).toBe(1.5);
  });
  it('opens an empty state with zero cash flow and no undefined percentages', async () => {
    const state = fixture(); state.transactions = []; state.recurringRules = []; state.budgets = [];
    const { workbook, files } = await read(state);
    const overview = workbook.getWorksheet('Overview')!;
    expect(overview.getCell('B5').result).toBe(0);
    expect(overview.getCell('B6').result).toBe(0);
    expect(overview.getCell('B7').result).toBe(0);
    expect(overview.getCell('B8').value).toBe('No recorded income');
    expect(workbook.getWorksheet('Transactions')!.rowCount).toBe(4);
    expect(strFromU8(files['xl/worksheets/sheet1.xml']!)).not.toMatch(/NaN|Infinity|#DIV/);
  });
  it('shows direct category allocations and percentage of recorded income', async () => {
    const { workbook } = await read();
    const categories = workbook.getWorksheet('Categories')!;
    expect(categories.getCell('A6').value).toBe('Food & drink');
    expect(categories.getCell('B6').value).toBe('Dining');
    expect(categories.getCell('D6').value).toBe(1200.55);
    expect(categories.getCell('E6').value).toEqual({ formula: 'D6/Overview!$B$5', result: 0.0120055 });
    expect(categories.getCell('D7').value).toBe(999.45);
    expect(categories.rowCount).toBe(7);
  });
  it('leaves category share empty when there is no recorded income', async () => {
    const state = fixture(); state.transactions = state.transactions.filter(tx => tx.kind === 'expense');
    const { workbook } = await read(state);
    expect(workbook.getWorksheet('Categories')!.getCell('E5').value).toBeNull();
  });
  it('exports actual weekly configuration without inventing monthly payments', async () => {
    const state = fixture(); state.transactions[1]!.recurringId = 'rule-1';
    const { workbook } = await read(state);
    const recurring = workbook.getWorksheet('Recurring')!;
    expect(recurring.getCell('C5').value).toBe(500);
    expect(recurring.getCell('D5').value).toBe('weekly');
    expect(recurring.getCell('H5').value).toBe(1);
    expect(recurring.getCell('I5').value).toBe(1200.55);
    expect(workbook.getWorksheet('Overview')!.getCell('B6').result).toBe(2200);
  });
  it('keeps budget current-cycle actual independent from selected report range', async () => {
    const { workbook } = await read(fixture(), { start: '2026-09-01', end: '2026-09-30' });
    expect(workbook.getWorksheet('Overview')!.getCell('B6').result).toBe(0);
    const budget = workbook.getWorksheet('Budget vs Actual')!;
    expect(budget.getCell('B5').value).toBe(3000);
    expect(budget.getCell('C5').value).toBe(2200);
    expect(budget.getCell('D5').value).toEqual({ formula: 'B5-C5', result: 800 });
    expect(budget.getCell('E5').result).toBeCloseTo(2200 / 3000);
  });
});
