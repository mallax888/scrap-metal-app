"use client";

import { useSyncExternalStore } from "react";

function noop() {
  return () => {};
}

function fromHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Time-of-day greeting taken from the viewer's clock. Rendered on the server as
 * "Good morning" and corrected during hydration, so there's no mismatch and no
 * setState-in-effect.
 */
export function useGreeting(): string {
  return useSyncExternalStore(
    noop,
    () => fromHour(new Date().getHours()),
    () => "Good morning"
  );
}
