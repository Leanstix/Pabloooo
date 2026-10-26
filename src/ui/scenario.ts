import { formatMoney, parseMoney, sumKobo } from '../domain';

export function spendingScenario(remaining: number, days: number, cut: string, extra: string) {
  const reduction = cut.trim() ? parseMoney(cut) : 0;
  const additional = extra.trim() ? parseMoney(extra) : 0;
  if (reduction === null || additional === null || reduction < 0 || additional < 0) {
    return { ok: false as const, error: 'Use non-negative naira amounts with up to two decimal places.' };
  }
  try {
    const total = sumKobo([remaining, reduction, additional]);
    return { ok: true as const, total: formatMoney(total), daily: formatMoney(Math.floor(total / Math.max(days, 1))) };
  } catch {
    return { ok: false as const, error: 'That scenario exceeds the supported amount. Try smaller values.' };
  }
}
