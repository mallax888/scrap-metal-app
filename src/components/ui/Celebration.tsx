"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LitchiCharacter } from "@/components/brand/LitchiCharacter";
import { Button } from "./Button";

export interface CelebrationContent {
  title: string;
  message: string;
  /** Optional stat shown under the message, e.g. "$2,800 repaid". */
  stat?: string;
}

const CelebrationContext = createContext<((content: CelebrationContent) => void) | null>(null);

/** Fixed angles and distances so the burst is composed rather than random. */
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    id: i,
    x: Math.round(Math.cos(angle) * 120),
    y: Math.round(Math.sin(angle) * 120),
    delay: (i % 5) * 45,
    size: i % 3 === 0 ? 10 : 7,
    tone: i % 3 === 0 ? "var(--clay)" : "var(--litchi)",
  };
});

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<CelebrationContent | null>(null);

  const celebrate = useCallback((next: CelebrationContent) => setContent(next), []);
  const dismiss = useCallback(() => setContent(null), []);

  useEffect(() => {
    if (!content) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    // Long enough to read, short enough not to trap anyone.
    const timer = window.setTimeout(dismiss, 6000);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [content, dismiss]);

  const value = useMemo(() => celebrate, [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {content ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          role="alertdialog"
          aria-modal="true"
          aria-label={content.title}
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute inset-0 cursor-default bg-scrim backdrop-blur-[2px]"
          />

          <div className="celebrate-card relative flex w-full max-w-sm flex-col items-center rounded-card border border-sand bg-paper px-7 py-9 text-center shadow-lift">
            <div className="relative">
              {/* Confetti sits behind the character and is decorative only. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {CONFETTI.map((bit) => (
                  <span
                    key={bit.id}
                    className="celebrate-bit"
                    style={
                      {
                        "--x": `${bit.x}px`,
                        "--y": `${bit.y}px`,
                        "--d": `${bit.delay}ms`,
                        width: bit.size,
                        height: bit.size,
                        background: bit.tone,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <LitchiCharacter
                className="celebrate-character relative h-28 w-28 text-litchi"
                accent="var(--paper)"
              />
            </div>

            <h2 className="mt-6 text-[22px] font-semibold tracking-tight text-ink">
              {content.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-mist">{content.message}</p>
            {content.stat ? (
              <p className="numeric mt-4 rounded-full bg-rose px-4 py-1.5 text-sm font-semibold text-litchi">
                {content.stat}
              </p>
            ) : null}

            <Button className="mt-7 w-full" onClick={dismiss}>
              Nice
            </Button>
          </div>
        </div>
      ) : null}
    </CelebrationContext.Provider>
  );
}

export function useCelebrate() {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error("useCelebrate must be used inside <CelebrationProvider>");
  return context;
}
