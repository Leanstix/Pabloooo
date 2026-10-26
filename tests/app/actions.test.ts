import { describe, expect, it, vi } from 'vitest';
import { createActionService } from '../../src/app/actions';
import { FinanceEngine } from '../../src/app/engine';
import { fresh, memoryRepository } from './fixtures';

async function setup() {
  const { repository } = memoryRepository(fresh());
  const engine = new FinanceEngine(repository, 'phone');
  await engine.initialize();
  const reminders = vi.fn(async () => undefined);
  return { engine, repository, reminders, actions: createActionService(engine, reminders) };
}
describe('notification and storage coordination', () => {
  it('validates reminder times before changing Android schedules', async () => {
    const { actions, reminders, repository } = await setup();
    await expect(actions.dispatch({ type: 'settings.update', value: { morningTime: '25:00' } })).rejects.toThrow();
    expect(reminders).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('keeps reminders disabled when Android denies permission', async () => {
    const { actions, reminders, engine } = await setup();
    reminders.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(actions.dispatch({ type: 'settings.update', value: { remindersEnabled: true } })).rejects.toThrow('Permission denied');
    expect(engine.getSnapshot().state.settings.remindersEnabled).toBe(false);
  });
  it('restores the previous schedule if settings cannot be saved', async () => {
    const { actions, reminders, engine, repository } = await setup();
    vi.mocked(repository.save).mockRejectedValueOnce(new Error('Disk full'));
    await expect(actions.dispatch({ type: 'settings.update', value: { remindersEnabled: true } })).rejects.toThrow('Disk full');
    expect(reminders.mock.calls.map(call => call[0])).toEqual([true, false]);
    expect(engine.getSnapshot().state.settings.remindersEnabled).toBe(false);
  });
  it('surfaces a failed rollback instead of claiming old schedules were restored', async () => {
    const { actions, reminders, repository } = await setup();
    vi.mocked(repository.save).mockRejectedValueOnce(new Error('Disk full'));
    reminders.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Android unavailable'));
    await expect(actions.dispatch({ type: 'settings.update', value: { remindersEnabled: true } })).rejects.toThrow('Configure reminders again');
  });
  it('reconciles against settings committed by a prior queued action', async () => {
    const { actions, reminders } = await setup();
    await Promise.all([
      actions.dispatch({ type: 'settings.update', value: { remindersEnabled: true, morningTime: '09:15' } }),
      actions.reconcileReminders(),
    ]);
    expect(reminders).toHaveBeenCalledTimes(2);
    expect(reminders.mock.calls[1]).toEqual([true, expect.objectContaining({ morningTime: '09:15', remindersEnabled: true })]);
  });
  it('serializes simultaneous reminder edits and recovers after a failed operation', async () => {
    const { actions, engine } = await setup();
    await expect(actions.dispatch({ type: 'settings.update', value: { cycleStartDay: 99 } })).rejects.toThrow();
    await Promise.all([
      actions.dispatch({ type: 'settings.update', value: { morningTime: '07:30' } }),
      actions.dispatch({ type: 'settings.update', value: { eveningTime: '21:45' } }),
    ]);
    expect(engine.getSnapshot().state.settings).toMatchObject({ morningTime: '07:30', eveningTime: '21:45' });
  });
});
