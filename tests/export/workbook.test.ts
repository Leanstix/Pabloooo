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
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T12:00:00Z')); });
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
});
