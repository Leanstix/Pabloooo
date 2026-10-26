/** Test harness adapter: load the same bundled icon font using browser FontFace. */
const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();
export const isLoaded = (name: string) => loaded.has(name);
export async function loadAsync(fonts: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(fonts).map(([name, source]) => {
      if (loaded.has(name)) return Promise.resolve();
      const operation =
        pending.get(name) ??
        (async () => {
          const font = await new FontFace(name, `url(${source})`).load();
          document.fonts.add(font);
          loaded.add(name);
        })();
      pending.set(name, operation);
      return operation;
    }),
  );
}
