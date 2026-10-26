export interface CashflowPoint { key: string; incomeKobo: number; expenseKobo: number }

/** Keys are local calendar buckets, so parse their parts rather than as UTC dates. */
export function intervalLabel(key: string): string {
  const [calendar, hour] = key.split('T');
  const [year, month, day] = (calendar || '').split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) return key;
  const date = new Date(year, month - 1, day || 1, 12);
  const label = date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric', ...(day ? { day: 'numeric' as const } : {}) });
  return hour ? `${label} · ${hour}` : label;
}

export function compactNaira(kobo: number): string {
  const naira = kobo / 100;
  const scale = naira >= 1e12 ? { value: 1e12, suffix: 'T' } : naira >= 1e9 ? { value: 1e9, suffix: 'B' } : naira >= 1e6 ? { value: 1e6, suffix: 'M' } : naira >= 1e3 ? { value: 1e3, suffix: 'k' } : { value: 1, suffix: '' };
  return `₦${Number((naira / scale.value).toFixed(scale.value === 1 && naira < 10 ? 2 : 1))}${scale.suffix}`;
}

/** Keep selection stable through updates; default to the most recent active bucket. */
export function selectedInterval(points: CashflowPoint[], key: string | null): number {
  const selected = key ? points.findIndex(point => point.key === key) : -1;
  if (selected >= 0) return selected;
  for (let index = points.length - 1; index >= 0; index--) {
    const point = points[index];
    if (point && (point.incomeKobo || point.expenseKobo)) return index;
  }
  return points.length ? 0 : -1;
}
