import { expect, it, vi } from 'vitest';
import { FinanceEngine } from '../../src/app/engine';
import { entry, fresh, memoryRepository } from './fixtures';

it('does not write a stale revision when deleting an already deleted entry', async () => {
  const { repository } = memoryRepository(fresh());
  const engine = new FinanceEngine(repository, 'phone');
  await engine.initialize();
  await engine.dispatch({ type: 'transaction.save', value: entry('lunch') });
  await engine.dispatch({ type: 'transaction.delete', id: 'lunch' });
  vi.mocked(repository.save).mockClear();
  await engine.dispatch({ type: 'transaction.delete', id: 'lunch' });
  expect(repository.save).not.toHaveBeenCalled();
  expect(engine.getSnapshot().state.revision).toBe(2);
});
