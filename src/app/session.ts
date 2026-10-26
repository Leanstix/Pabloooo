import type { FinanceEngine } from './engine';

/** Serialize bootstrap and disposal across React's development effect remounts. */
export function createSessionManager() {
  let queue: Promise<void> = Promise.resolve();
  return {
    open(factory: () => Promise<FinanceEngine>) {
      let cancelled = false;
      let engine: FinanceEngine | null = null;
      let disposal: Promise<void> | null = null;
      const dispose = () => engine ? (disposal ??= engine.close()) : Promise.resolve();
      const ready = queue.then(async () => {
        if (cancelled) return null;
        engine = await factory();
        if (cancelled) { await dispose(); return null; }
        try { await engine.initialize(); }
        catch (error) { await dispose().catch(() => undefined); throw error; }
        if (cancelled) { await dispose(); return null; }
        return engine;
      });
      queue = ready.then(() => undefined, () => undefined);
      return {
        ready,
        cancel() {
          cancelled = true;
          queue = queue.then(dispose).catch(() => undefined);
        },
      };
    },
  };
}
