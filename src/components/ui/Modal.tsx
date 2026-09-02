"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";

/**
 * A lightweight dialog: escape to close, click-outside to close, scroll lock,
 * and focus moved into (and back out of) the panel.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(focusTimer);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={clsx(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-card bg-paper shadow-lift outline-none animate-pop sm:rounded-card",
          widths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-sand/70 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-mist">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist transition-colors hover:bg-cream hover:text-ink"
          >
            <X className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-sand/70 bg-canvas px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
