import { execFileSync } from 'node:child_process';
import { buildSync } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { categoryFrequency, initialState, reduceFinance, reportRange } from '../../src/domain';
import type { FinanceState, TransactionInput } from '../../src/domain';

const now = '2026-10-26T12:00:00Z';
const range = reportRange('month', '2026-10-26');
const fresh = () => initialState('frequency-test', now);
function add(state: FinanceState, input: Partial<TransactionInput> = {}): FinanceState {
  return reduceFinance(
    state,
    {
      type: 'transaction.save',
      value: {
        id: `entry-${state.revision}`,
        kind: 'expense',
        amountKobo: 100,
        categoryId: 'category-feeding',
        note: '',
        merchant: '',
        occurredAt: '2026-10-26',
        recurringId: null,
        ...input,
      },
    },
    now,
  );
}

describe('actual category activity frequency', () => {
  it('returns useful empty statistics and validates both category and range', () => {
    expect(categoryFrequency(fresh(), 'category-feeding', range)).toEqual({
      count: 0,
      activeDays: 0,
      averageKobo: 0,
      averageGapDays: null,
      recurringCount: 0,
    });
    expect(() => categoryFrequency(fresh(), 'missing', range)).toThrow(/Category/);
    expect(() =>
      categoryFrequency(fresh(), 'category-feeding', { start: range.end, end: range.start }),
    ).toThrow(/range/);
  });
});

it('includes direct and child entries while keeping child-only queries scoped', () => {
  let state = reduceFinance(
    fresh(),
    {
      type: 'category.save',
      value: {
        id: 'snacks',
        name: 'Snacks',
        kind: 'expense',
        parentId: 'category-feeding',
        color: '#123456',
        icon: 'cafe',
        archived: false,
      },
    },
    now,
  );
  state = add(state, { amountKobo: 100, occurredAt: '2026-10-01' });
  state = add(state, { amountKobo: 200, occurredAt: '2026-10-03', categoryId: 'snacks' });
  state = add(state, { amountKobo: 300, occurredAt: '2026-10-07', categoryId: 'snacks' });
  state = add(state, { amountKobo: 999, categoryId: 'category-transportation' });
  expect(categoryFrequency(state, 'category-feeding', range)).toEqual({
    count: 3,
    activeDays: 3,
    averageKobo: 200,
    averageGapDays: 3,
    recurringCount: 0,
  });
  expect(categoryFrequency(state, 'snacks', range)).toEqual({
    count: 2,
    activeDays: 2,
    averageKobo: 250,
    averageGapDays: 4,
    recurringCount: 0,
  });
});

it('keeps one active day and no gap estimate for repeated same-day entries', () => {
  const single = add(fresh(), { amountKobo: 101 });
  expect(categoryFrequency(single, 'category-feeding', range)).toEqual({
    count: 1,
    activeDays: 1,
    averageKobo: 101,
    averageGapDays: null,
    recurringCount: 0,
  });
  const repeated = add(single, { amountKobo: 102 });
  expect(categoryFrequency(repeated, 'category-feeding', range)).toEqual({
    count: 2,
    activeDays: 1,
    averageKobo: 102,
    averageGapDays: null,
    recurringCount: 0,
  });
});

it('excludes deleted entries and the exclusive end while including the exact start', () => {
  let state = add(fresh(), { id: 'before', amountKobo: 1000, occurredAt: '2026-09-30' });
  state = add(state, { id: 'start', amountKobo: 111, occurredAt: range.start });
  state = add(state, { id: 'end', amountKobo: 1000, occurredAt: range.end });
  state = add(state, { id: 'removed', amountKobo: 1000, occurredAt: '2026-10-15' });
  state = reduceFinance(state, { type: 'transaction.delete', id: 'removed' }, now);
  expect(categoryFrequency(state, 'category-feeding', range)).toEqual({
    count: 1,
    activeDays: 1,
    averageKobo: 111,
    averageGapDays: null,
    recurringCount: 0,
  });
});

it('counts actual confirmed links and keeps archived category history available', () => {
  let state = reduceFinance(
    fresh(),
    {
      type: 'recurring.save',
      value: {
        id: 'weekly',
        name: 'Meal plan',
        kind: 'expense',
        amountKobo: 200,
        categoryId: 'category-feeding',
        frequency: 'weekly',
        nextDueDate: '2026-10-01',
        active: true,
      },
    },
    now,
  );
  expect(categoryFrequency(state, 'category-feeding', range).count).toBe(0);
  state = reduceFinance(
    state,
    {
      type: 'recurring.confirm',
      id: 'weekly',
      transactionId: 'confirmed',
      occurredAt: '2026-10-01',
    },
    now,
  );
  state = add(state, { amountKobo: 400, occurredAt: '2026-10-04' });
  state = reduceFinance(state, { type: 'category.archive', id: 'category-feeding' }, now);
  expect(categoryFrequency(state, 'category-feeding', range)).toEqual({
    count: 2,
    activeDays: 2,
    averageKobo: 300,
    averageGapDays: 3,
    recurringCount: 1,
  });
});

it('rounds average transaction size without floating-point currency loss', () => {
  let state = add(fresh(), { amountKobo: Number.MAX_SAFE_INTEGER - 2 });
  state = add(state, { amountKobo: 2 });
  expect(categoryFrequency(state, 'category-feeding', range).averageKobo).toBe(4503599627370496);
  const income = add(fresh(), { kind: 'income', categoryId: 'category-salary', amountKobo: 123 });
  expect(categoryFrequency(income, 'category-salary', range)).toMatchObject({
    count: 1,
    activeDays: 1,
    averageKobo: 123,
  });
});

it('averages distinct calendar day gaps even with unsorted repeated entries', () => {
  let state = add(fresh(), { occurredAt: '2026-10-06' });
  state = add(state, { occurredAt: '2026-10-01' });
  state = add(state, { occurredAt: '2026-10-02' });
  state = add(state, { occurredAt: '2026-10-02' });
  expect(categoryFrequency(state, 'category-feeding', range)).toMatchObject({
    count: 4,
    activeDays: 3,
    averageGapDays: 2.5,
  });
});

it('uses local calendar day gaps across spring and fall daylight saving changes', () => {
  const bundled = buildSync({
    entryPoints: [new URL('../../src/domain/patterns.ts', import.meta.url).pathname],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
  }).outputFiles[0]!.text;
  const template = add(fresh()).transactions[0]!;
  const probe = `const module={exports:{}};new Function('module','exports',${JSON.stringify(bundled)})(module,module.exports);
    const state=${JSON.stringify(fresh())};const template=${JSON.stringify(template)};
    function frequency(dates,start,end){state.transactions=dates.map((occurredAt,index)=>({...template,id:'probe-'+index,occurredAt}));return module.exports.categoryFrequency(state,'category-feeding',{start,end});}
    console.log(JSON.stringify({
      spring:frequency(['2026-03-07T17:00:00Z','2026-03-08T16:00:00Z','2026-03-09T16:00:00Z'],'2026-03-07','2026-03-10'),
      fall:frequency(['2026-10-31T16:00:00Z','2026-11-01T17:00:00Z','2026-11-02T17:00:00Z'],'2026-10-31','2026-11-03'),
      local:frequency(['2026-03-08T03:30:00Z','2026-03-08T04:30:00Z','2026-03-08T07:30:00Z'],'2026-03-07','2026-03-09')
    }));`;
  const result = JSON.parse(
    execFileSync(process.execPath, ['-e', probe], {
      env: { ...process.env, TZ: 'America/New_York' },
      encoding: 'utf8',
    }),
  );
  expect(result.spring).toMatchObject({ count: 3, activeDays: 3, averageGapDays: 1 });
  expect(result.fall).toMatchObject({ count: 3, activeDays: 3, averageGapDays: 1 });
  expect(result.local).toMatchObject({ count: 3, activeDays: 2, averageGapDays: 1 });
});
