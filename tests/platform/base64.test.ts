import { expect, it } from 'vitest';
import { decodeBase64 } from '../../src/platform/core/base64';
import { pngHeader } from './fixtures';
it('decodes the bounded PNG header read by Expo file system', () => {
  const header = pngHeader();
  expect(decodeBase64(Buffer.from(header).toString('base64'))).toEqual(header);
  expect([...decodeBase64('AQI=')]).toEqual([1, 2]);
  expect([...decodeBase64('AQ==')]).toEqual([1]);
});
it('rejects malformed native data instead of passing unbounded garbage to PNG decoding', () => {
  expect(() => decodeBase64('x')).toThrow('base64');
  expect(() => decodeBase64('!!!!')).toThrow('base64');
});
