import { expect, it } from 'vitest';
import { inspectPng, MAX_PNG_BYTES } from '../../src/platform/core/png';
import { pngHeader } from './fixtures';
it('accepts a real PNG header independently of filename and enforces dimensions', () => {
  expect(inspectPng(pngHeader(1024, 512), 1000, 'image/png')).toEqual({ width: 1024, height: 512 });
  for (const dimensions of [[0, 1], [1, 0], [4097, 1], [1, 4097]]) {
    expect(() => inspectPng(pngHeader(dimensions[0], dimensions[1]), 1000, 'image/png')).toThrow('4096');
  }
});
it('rejects renamed JPEGs, unknown MIME, truncated and oversized files before decode', () => {
  expect(() => inspectPng(pngHeader(), 1000, 'image/jpeg')).toThrow('PNG');
  expect(() => inspectPng(pngHeader(), 1000, null)).toThrow('PNG');
  expect(() => inspectPng(new Uint8Array(32), 1000, 'image/png')).toThrow('valid PNG');
  expect(() => inspectPng(pngHeader(), 32, 'image/png')).toThrow('8 MB');
  expect(() => inspectPng(pngHeader(), MAX_PNG_BYTES + 1, 'image/png')).toThrow('8 MB');
});
