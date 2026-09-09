"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "./local-store";
import { findVerification, type VerificationStatus } from "./verification";

/**
 * Agent responses, remembered in the browser.
 *
 * The move journey and the agent's verification link are two different screens
 * reached by two different people, which is exactly the point of the product
 * and exactly what makes it awkward to demonstrate. Persisting the agent's
 * answer means someone can open the link, verify the tenancy, come back, and
 * find the application has moved on — the loop closes instead of being
 * described.
 *
 * Browser-local and per-viewer, like everything else in this prototype. No
 * verification here has any effect on anybody's real tenancy.
 */
const store = createLocalStore<Record<string, VerificationStatus>>("litchi.verifications", {});

export function respondToVerification(token: string, status: VerificationStatus): void {
  store.setState((prev) => ({ ...prev, [token]: status }));
}

export function clearVerification(token: string): void {
  store.setState((prev) => {
    const next = { ...prev };
    delete next[token];
    return next;
  });
}

/**
 * The live status for a token: whatever the agent answered in this browser,
 * falling back to the state the sample data ships with.
 */
export function useVerificationStatus(token: string): VerificationStatus {
  const responses = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return responses[token] ?? findVerification(token)?.status ?? "awaiting";
}
