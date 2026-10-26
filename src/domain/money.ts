/** Parse naira text directly into integer kobo, without floating-point currency math. */
export function parseMoney(input: string): number | null {
  const text = input.trim().replace(/^(?:₦|NGN\s*)/i, '').trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole = '', fraction = ''] = text.replace(/,/g, '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : null;
}

export function assertKobo(value: unknown, label = 'Amount', allowZero = true): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`${label} must be ${allowZero ? 'a non-negative' : 'a positive'} safe integer in kobo.`);
  }
}

/** Refuse overflow rather than silently rounding stored or aggregated money. */
export function sumKobo(values: readonly number[]): number {
  let total = 0n;
  for (const value of values) {
    if (!Number.isSafeInteger(value)) throw new Error('Unsafe monetary value.');
    total += BigInt(value);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER) || total < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error('Money total exceeds the supported safe range.');
  }
  return Number(total);
}

export function formatMoney(kobo: number): string {
  if (!Number.isSafeInteger(kobo)) throw new Error('Cannot format unsafe monetary value.');
  const negative = kobo < 0;
  const digits = BigInt(kobo < 0 ? -kobo : kobo);
  const naira = (digits / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}₦${naira}.${(digits % 100n).toString().padStart(2, '0')}`;
}
