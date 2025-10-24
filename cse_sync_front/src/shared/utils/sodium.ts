import _sodium from "libsodium-wrappers";

type Sodium = typeof _sodium;

let sodiumInstance: Sodium | null = null;
let initializationPromise: Promise<Sodium> | null = null;

export async function getSodium(): Promise<Sodium> {
  if (sodiumInstance) {
    return sodiumInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await _sodium.ready;
      sodiumInstance = _sodium;
      return sodiumInstance;
    } catch (error) {
      initializationPromise = null;
      throw new Error(
        `Failed to initialize libsodium: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  })();

  return initializationPromise;
}

export type { Sodium };
