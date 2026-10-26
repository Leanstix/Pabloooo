import { describe, expect, it } from 'vitest';
import { parseMoney, formatMoney, sumKobo, assertKobo } from '../../src/domain/money';

describe('integer kobo money', () => {
  it('parses naira exactly and formats kobo without floating currency arithmetic', () => {
    expect(parseMoney('0.29')).toBe(29);
    expect(parseMoney('₦1,234,567.89')).toBe(123456789);
    expect(parseMoney('NGN 50.5')).toBe(5050);
    expect(formatMoney(123456789)).toBe('₦1,234,567.89');
    expect(formatMoney(-1)).toBe('-₦0.01');
  });
});

it('rejects misplaced commas exponent notation signs and more than two decimals', () => {
  for (const input of ['', ' ', '-1', '+1', '1e3', 'Infinity', 'NaN', '1.001', '1,00', '12,34,567', '.50', '50.', '1 000', '₦']) {
    expect(parseMoney(input), input).toBeNull();
  }
});
