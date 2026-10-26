import { expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { parseBackup, serializeBackup } from '../../src/platform/core/backup';
import { checksum } from '../../src/platform/core/integrity';
import { fixtureState } from './fixtures';
it('rejects changed contents, unsupported versions and malformed JSON', () => {
  const envelope = JSON.parse(serializeBackup(fixtureState(), validateFinanceState));
  envelope.data.settings.currency = 'USD';
  expect(() => parseBackup(JSON.stringify(envelope), validateFinanceState)).toThrow(
    'incomplete or has changed',
  );
  envelope.checksum = checksum(JSON.stringify(envelope.data));
  expect(() => parseBackup(JSON.stringify(envelope), validateFinanceState)).toThrow('NGN');
  envelope.version = 99;
  expect(() => parseBackup(JSON.stringify(envelope), validateFinanceState)).toThrow('supported');
  expect(() => parseBackup('{', validateFinanceState)).toThrow('valid JSON');
  expect(() => parseBackup('null', validateFinanceState)).toThrow('Pabloooo');
});
it('rejects unsafe money and orphaned categories even with a valid integrity code', () => {
  const envelope = JSON.parse(serializeBackup(fixtureState(), validateFinanceState));
  envelope.data.transactions[0].amountKobo = Number.MAX_SAFE_INTEGER + 1;
  envelope.checksum = checksum(JSON.stringify(envelope.data));
  expect(() => parseBackup(JSON.stringify(envelope), validateFinanceState)).toThrow();
  envelope.data.transactions[0].amountKobo = 100;
  envelope.data.transactions[0].categoryId = 'missing';
  envelope.checksum = checksum(JSON.stringify(envelope.data));
  expect(() => parseBackup(JSON.stringify(envelope), validateFinanceState)).toThrow('reference');
});
