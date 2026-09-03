"use client";

import { useEffect } from "react";

/**
 * Keeps Tab inside a container while it is open.
 *
 * Declaring aria-modal="true" tells assistive technology that the rest of the
 * page is inert. Nothing enforces that on its own, so without this Tab walks
 * straight out of the panel and into the page behind it — the announcement and
 * the actual focus order disagree, and a keyboard user ends up somewhere they
 * were told they could not reach.
 *
 * Focus starting on the container itself is expected: the first Tab is left
 * alone so the browser moves inward naturally, and only the wrap at either end
 * is intercepted.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = ref.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
        // offsetParent is null for anything display:none, which is how the
        // disabled and collapsed bits of these panels are hidden.
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      const outside = !activeEl || !container.contains(activeEl);

      if (event.shiftKey) {
        if (outside || activeEl === first || activeEl === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (outside || activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ref, active]);
}
