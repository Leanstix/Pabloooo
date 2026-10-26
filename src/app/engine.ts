import { initialState, reduceFinance, validateFinanceState } from '../domain';
import type { AppAction, FinanceState } from '../domain/types';
import { errorMessage } from './errors';
import type { FinanceRepository } from './repository';

export interface EngineSnapshot {
  state: FinanceState;
  ready: boolean;
  busy: boolean;
  error: string | null;
}

/** Persist before publishing. Serialize edits so rapid taps cannot lose a prior write. */
export class FinanceEngine {
  private snapshot: EngineSnapshot;
  private readonly listeners = new Set<() => void>();
  private queue: Promise<void> = Promise.resolve();
  private initialization: Promise<void> | null = null;
  private pending = 0;

  constructor(private readonly repository: FinanceRepository, installationId: string) {
    this.snapshot = { state: initialState(installationId), ready: false, busy: false, error: null };
  }

  getSnapshot = (): EngineSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(patch: Partial<EngineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }

  dismissError = (): void => { this.update({ error: null }); };
  reportError = (error: unknown): void => { this.update({ error: errorMessage(error) }); };

  initialize(): Promise<void> {
    if (this.snapshot.ready) return Promise.resolve();
    if (this.initialization) return this.initialization;
    this.update({ busy: true, error: null });
    this.initialization = (async () => {
      try {
        const stored = await this.repository.load();
        const state = stored === null ? this.snapshot.state : validateFinanceState(stored);
        if (stored === null) await this.repository.save(state);
        this.update({ state, ready: true });
      } catch (error) {
        this.reportError(error);
        throw error;
      } finally {
        this.update({ busy: false });
        this.initialization = null;
      }
    })();
    return this.initialization;
  }

  private enqueue(operation: (state: FinanceState) => Promise<FinanceState>): Promise<void> {
    this.pending += 1;
    this.update({ busy: true, error: null });
    const result = this.queue.then(async () => {
      if (!this.snapshot.ready) throw new Error('Wait until your records finish loading.');
      const next = await operation(this.snapshot.state);
      await this.repository.save(next);
      this.update({ state: next });
    });
    const settled = result.catch((error: unknown) => {
      this.reportError(error);
      throw error;
    }).finally(() => {
      this.pending -= 1;
      this.update({ busy: this.pending > 0 });
    });
    this.queue = settled.catch(() => undefined);
    return settled;
  }

  dispatch = (action: AppAction): Promise<void> =>
    this.enqueue(async (state) => reduceFinance(state, action));

  restore = (input: unknown): Promise<void> => this.enqueue(async (state) => {
    const restored = validateFinanceState(input);
    return validateFinanceState({
      ...restored,
      revision: state.revision + 1,
      settings: { ...restored.settings, remindersEnabled: false },
    });
  });
}
