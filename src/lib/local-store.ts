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

  function notify() {
    listeners.forEach((listener) => listener());
  }

  /*
   * Another tab wrote to this key. The tenancy verification flow depends on
   * exactly this — the agent answers in one tab and the application updates in
   * the other — and without it the first tab shows stale state until reload.
   */
  let watching = false;
  function watchOtherTabs() {
    if (watching || typeof window === "undefined") return;
    watching = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;
      try {
        state = event.newValue === null ? fallback : (JSON.parse(event.newValue) as T);
      } catch {
        return; // a malformed write elsewhere should not blow up this tab
      }
      initialized = true;
      notify();
    });
  }

  return {
    subscribe(listener: () => void) {
      watchOtherTabs();
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
      notify();
    },
  };
}
