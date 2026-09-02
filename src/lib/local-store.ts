// A tiny external store backed by localStorage, read via useSyncExternalStore
// so the server snapshot (the fallback) and the client's first paint always
// match — no hydration mismatch, no setState-in-effect.
export function createLocalStore<T>(key: string, fallback: T) {
  let state = fallback;
  let initialized = false;
  const listeners = new Set<() => void>();

  function ensureInitialized() {
    if (initialized || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      // ignore malformed/blocked storage
    }
    initialized = true;
  }

  function persist() {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota/blocked storage
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): T {
      ensureInitialized();
      return state;
    },
    getServerSnapshot(): T {
      return fallback;
    },
    setState(updater: T | ((prev: T) => T)) {
      ensureInitialized();
      state = typeof updater === "function" ? (updater as (prev: T) => T)(state) : updater;
      persist();
      listeners.forEach((listener) => listener());
    },
  };
}
