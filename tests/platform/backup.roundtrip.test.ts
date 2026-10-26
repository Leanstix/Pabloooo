import { expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { parseBackup, serializeBackup } from '../../src/platform/core/backup';
import { fixtureState } from './fixtures';
it('round-trips IDs, soft deletes, recurrence, NGN integer amounts and settings', () => {
  const state = fixtureState(17);
  state.settings.morningTime = '07:35'; state.settings.eveningTime = '21:15';
  const text = serializeBackup(state, validateFinanceState, new Date('2026-10-26T10:00:00.000Z'));
  const envelope = JSON.parse(text);
  expect(envelope.format).toBe('pabloooo.local-backup');
  expect(envelope.createdAt).toBe('2026-10-26T10:00:00.000Z');
  expect(parseBackup(text, validateFinanceState)).toEqual(state);
  expect(envelope.data.transactions[0].deletedAt).not.toBeNull();
});
