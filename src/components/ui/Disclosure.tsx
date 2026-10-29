"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

/**
 * A heading you press, with the detail underneath.
 *
 * The app reaches for this shape in three places now — the tenancy board's
 * blocks, the cover's "See every line", and the Moving Fund's machinery — and
 * each had grown its own copy of the state, the chevron and the aria wiring.
 * Three copies is three places for the rotation to drift and for someone to
 * forget `aria-controls`.
 *
 * The summary is a real heading rather than a styled div, so the page still
 * has an outline when every section is closed — which is how a screen reader
 * user decides what to open.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx("border-t border-sand/90", className)}>
      <h2>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={id}
          className="tap flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-ink transition-colors hover:text-bark"
        >
          {title}
          <ChevronDown
            className={clsx(
              "h-[17px] w-[17px] shrink-0 text-bark transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </h2>
      <div id={id} hidden={!open} className="animate-pop pb-5">
        {children}
      </div>
    </div>
  );
}
