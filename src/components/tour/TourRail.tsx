"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { TOUR, TOUR_PARAM, stopHref, stopIndexFrom } from "@/lib/tour";

/**
 * The rail that turns nine screens into one story.
 *
 * It sits over the real app rather than replacing it: the screen underneath is
 * the actual product, and this only says which part of it to look at. Position
 * lives in the URL, so a reload keeps your place, the back button behaves, and
 * you can send someone a link to step four.
 *
 * Rendered from the root layout, which means it has to be invisible unless the
 * URL asks for it — and an unrecognised ?tour value counts as not asking.
 */
function Rail() {
  const params = useSearchParams();
  const pathname = usePathname();

  // Which stop the reader dismissed, so leaving hides the rail immediately.
  // Held as the parameter value rather than a boolean: stepping to a different
  // stop is a different value, and the rail comes back for it.
  const [dismissed, setDismissed] = useState<string | null>(null);

  // On a phone the rail sits at the bottom, where it takes up no space and
  // covers whatever is at the end of the page — on /payments that was the demo
  // control the tour tells you to use. A spacer in normal flow gives the page
  // somewhere to scroll to, measured rather than guessed because the copy sets
  // the height. On a wide screen the rail moves to the top corner instead, so
  // the spacer is not needed and is hidden there.
  const barRef = useRef<HTMLElement>(null);
  const [barHeight, setBarHeight] = useState(0);

  const raw = params.get(TOUR_PARAM);
  const index = stopIndexFrom(raw);
  const stop = index === null ? null : TOUR[index];
  // The rail follows the URL, but the URL can be edited. Pointing at the wrong
  // screen would be worse than not appearing, so it checks.
  const visible = stop !== null && dismissed !== raw && pathname === stop.href;

  // Reserves the column the panel sits in, so it is beside the app rather than
  // over it. Paired with a CSS rule so the width only applies where there is
  // room for it; the attribute comes off the moment the rail does.
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.setAttribute("data-tour-rail", "on");
    return () => root.removeAttribute("data-tour-rail");
  }, [visible]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      setBarHeight(0);
      return;
    }
    const measure = () => setBarHeight(bar.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [visible, raw]);

  if (!visible || stop === null || index === null) return null;

  const isLast = index === TOUR.length - 1;

  /**
   * Leaving means dropping a query parameter from the URL you are already on,
   * and the App Router will not do that: both <Link href={pathname}> and
   * router.replace(pathname) count as navigating to the page you are on and
   * no-op, parameter and all. So the parameter is cleared on the history entry
   * directly and the rail hidden by state — the same result the navigation
   * would have produced, without reloading the screen underneath.
   */
  function leave() {
    setDismissed(raw);
    window.history.replaceState(null, "", pathname);
  }

  return (
    <>
      {/* Keeps the end of the page reachable above the bar on a phone. */}
      <div className="min-[1400px]:hidden" style={{ height: barHeight }} aria-hidden />

      {/* A landmark, so the rail's copy is not content adrift outside one.
          A bar across the bottom until the window is wide enough to give the
          panel a column of its own down the right-hand side, centred, with the
          page padded to match so it sits beside the app rather than over it.
          The threshold is where that column can be carved out and still leave
          the app a workable width — below it, reserving 380px squeezed the
          content to a word per line. */}
      <aside
        ref={barRef}
        aria-label="Guided tour"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-5 min-[1400px]:inset-x-auto min-[1400px]:bottom-auto min-[1400px]:right-0 min-[1400px]:top-1/2 min-[1400px]:-translate-y-1/2 min-[1400px]:justify-end"
      >
        <div className="pointer-events-auto w-full max-w-3xl rounded-card bg-hero px-4 py-4 text-onbrand shadow-lift sm:px-6 sm:py-5 min-[1400px]:w-[340px] min-[1400px]:max-w-none">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="numeric text-[11px] font-semibold uppercase tracking-[0.16em] text-onbrand/60">
                Step {index + 1} of {TOUR.length}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug">{stop.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-onbrand/70">{stop.look}</p>
            </div>
            <button
              type="button"
              onClick={leave}
              aria-label="Leave the tour"
              className="tap -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-onbrand/60 transition-colors hover:bg-onbrand/10 hover:text-onbrand"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {index > 0 ? (
              <Link
                href={stopHref(index - 1)}
                className="tap flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-onbrand/70 transition-colors hover:bg-onbrand/10 hover:text-onbrand"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </Link>
            ) : null}

            {isLast ? (
              <Link
                href="/tour"
                className="tap ml-auto flex items-center gap-1.5 rounded-full bg-onbrand px-4 py-2 text-[13px] font-semibold text-hero transition-opacity hover:opacity-90"
              >
                Finish
              </Link>
            ) : (
              <Link
                href={stopHref(index + 1)}
                className="tap ml-auto flex items-center gap-1.5 rounded-full bg-onbrand px-4 py-2 text-[13px] font-semibold text-hero transition-opacity hover:opacity-90"
              >
                {TOUR[index + 1].label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>

          {/* Position as a bar rather than a row of dots — seven dots at this
              size are a decoration, not a progress indicator. */}
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-onbrand/15">
            <div
              className="h-full rounded-full bg-onbrand/70 transition-[width] duration-300"
              style={{ width: `${((index + 1) / TOUR.length) * 100}%` }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

export function TourRail() {
  // useSearchParams opts the tree into client rendering, so the boundary keeps
  // that scoped to the rail instead of the page it is sitting on.
  return (
    <Suspense fallback={null}>
      <Rail />
    </Suspense>
  );
}
