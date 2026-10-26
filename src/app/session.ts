import type { FinanceEngine } from './engine';

/** Serialize bootstrap and disposal across React's development effect remounts. */
export function createSessionManager() {
  let queue: Promise<void> = Promise.resolve();
  return {
    open(factory: () => Promise<FinanceEngine>) {
      let cancelled = false;
      let engine: FinanceEngine | null = null;
      const ready = queue.then(async () => {
        if (cancelled) return null;
        engine = await factory();
        if (cancelled) { await engine.close(); return null; }
        try { await engine.initialize(); }
        catch (error) { await engine.close().catch(() => undefined); throw error; }
        if (cancelled) { await engine.close(); return null; }
        return engine;
      });
      queue = ready.then(() => undefined, () => undefined);
      return {
        ready,
        cancel() {
          cancelled = true;
          queue = queue.then(async () => { await engine?.close(); }).catch(() => undefined);
        },
      };
    },
  };
}
