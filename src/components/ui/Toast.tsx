"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Check, Info } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "info";
}

const ToastContext = createContext<((message: string, tone?: ToastItem["tone"]) => void) | null>(
  null
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-ink py-2.5 pl-3 pr-5 text-sm text-cream shadow-lift animate-pop"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/15">
              {item.tone === "success" ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Info className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
