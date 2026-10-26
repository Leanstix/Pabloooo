import { expect, it } from 'vitest';
import { checksum, utf8ByteLength } from '../../src/platform/core/integrity';
it('counts Nigerian text, emoji and malformed surrogates by UTF-8 byte length', () => {
  for (const value of ['₦12,500', '🍚 rice', 'Ẹ káàárọ̀', '\ud800', '\udc00', 'simple ASCII']) {
    expect(utf8ByteLength(value)).toBe(new TextEncoder().encode(value).length);
  }
});
it('detects truncation and altered characters without depending on key ordering', () => {
  expect(checksum('Rice ₦500')).toBe(checksum('Rice ₦500'));
  expect(checksum('Rice ₦500')).not.toBe(checksum('Rice ₦50'));
  expect(checksum('Rice ₦500')).not.toBe(checksum('rice ₦500'));
});
