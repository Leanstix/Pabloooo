import { expect, it } from 'vitest';
import { createActionService } from '../../src/app/actions';
import { FinanceEngine } from '../../src/app/engine';
import { entry, fresh, memoryRepository } from './fixtures';

it('takes export snapshots after submitted edits have reached durable storage', async () => {
  const memory = memoryRepository(fresh());
  const engine = new FinanceEngine(memory.repository, 'phone');
  await engine.initialize();
  const actions = createActionService(engine, async () => undefined);
  const save = actions.dispatch({ type: 'transaction.save', value: entry('just-entered') });
  const snapshot = actions.readState();
  await save;
  expect((await snapshot).transactions[0]?.id).toBe('just-entered');
  expect(memory.read()?.transactions[0]?.id).toBe('just-entered');
});
