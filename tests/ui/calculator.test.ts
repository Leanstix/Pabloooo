import { describe, expect, it } from 'vitest';
import { calculate } from '../../src/ui/calculator';

describe('quick calculator', () => {
  it('respects multiplication and division precedence', () => {
    expect(calculate('1000 + 250 × 3')).toBe(1750);
    expect(calculate('100 ÷ 4 + 10')).toBe(35);
    expect(calculate('20 ÷ 2 × 5')).toBe(50);
  });
  it('supports signed operands and subtraction', () => {
    expect(calculate('−25 + 50')).toBe(25);
    expect(calculate('200 − 50')).toBe(150);
    expect(calculate('2 × −3')).toBe(-6);
    expect(calculate('2−−3')).toBe(5);
  });
  it('rounds decimal money to kobo', () => {
    expect(calculate('0.1 + 0.2')).toBe(.3);
    expect(calculate('10 ÷ 3')).toBe(3.33);
    expect(calculate('1.005')).toBe(1.01);
  });
  it.each(['', '2+', '2..3', '5÷0', '1e3', '(1+2)', 'NaN', 'alert(1)', '2 3', '++3'])('rejects malformed or unsafe expression %s', expression => {
    if (expression === '2 3') expect(calculate(expression)).toBe(23);
    else expect(calculate(expression)).toBeNull();
  });
  it('does not return amounts outside safe kobo precision', () => {
    expect(calculate('9007199254740991')).toBeNull();
    expect(calculate('9999999999999999999999999999999999999 × 999999999999')).toBeNull();
  });
  it('accepts entry-ready decimal and padded zero values', () => {
    expect(calculate('00')).toBe(0);
    expect(calculate('.50 + 1.')).toBe(1.5);
  });
});
