"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Compass, X } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { SidebarNav } from "./SidebarNav";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { APP_HOME, HOME_HREF } from "@/lib/nav";
import { DemoTag } from "@/components/marketing/DemoTag";
import { UserChip } from "./UserChip";

/**
 * A way back into the tour, from anywhere.
 *
 * Leaving the tour used to be one-way: dismiss the rail, or reach the last
 * stop, and the only route back in was knowing the /tour URL. That is exactly
 * the moment someone wants it again — to re-check something, or to walk a
 * second person through it.
 */
function TourLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/tour"
      onClick={onNavigate}
      className="tap flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-mist transition-colors hover:bg-cream hover:text-ink"
    >
      <Compass className="h-4 w-4 shrink-0" aria-hidden />
      Take the tour
    </Link>
  );
}

/**
 * The way back out to the front page.
 *
 * Every standalone screen — the calculator, the eligibility check, the agent
 * view, the tour, even the 404 — has its wordmark linked to the front page.
 * The one place that did not was the signed-in app, where the wordmark goes to
 * the app's own home instead. So from inside the demo account there was no
 * route back to the page that costs a move, short of editing the URL.
 */
function FrontPageLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href={HOME_HREF}
      onClick={onNavigate}
      className="tap flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-mist transition-colors hover:bg-cream hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      Back to the front page
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [drawerPath, setDrawerPath] = useState(pathname);

  // Close the drawer whenever the route changes — adjusted during render
  // rather than in an effect, so there is no extra paint with it still open.
  //
  // The tracked path has to move on *every* navigation, not only the ones that
  // happen with the drawer open. The drawer's own links call setDrawerOpen(false)
  // on click, so by the time the pathname lands the drawer has already closed —
  // gate this on drawerOpen and the path never catches up. It then went stale at
  // the previous route and swallowed the next tap on the menu button, which
  // opened the drawer and was immediately undone by this very branch. Two taps
  // to reopen, every time, after following a link from the drawer.
  if (pathname !== drawerPath) {
    setDrawerPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col border-r border-sand/80 bg-paper px-5 py-6 lg:flex">
        <Link href={APP_HOME} className="flex items-center gap-3 px-1.5">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
          {/* Visible on every screen behind the sidebar. The figures in here
              are invented, and nobody should have to be told that separately. */}
          <DemoTag />
        </Link>

        <div className="mt-9 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="mt-6 flex shrink-0 flex-col gap-3">
          <FrontPageLink />
          <TourLink />
          <ThemeToggle />
          <UserChip />
        </div>
      </aside>

      {/* Mobile top bar */}
      {/* Just the wordmark. The destinations are in the bar at the bottom of
          the screen where a thumb reaches them, and the settings that used to
          sit up here are in the More sheet with everything else. */}
      <header className="sticky top-0 z-30 flex items-center border-b border-sand/80 bg-canvas/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href={APP_HOME} className="tap flex items-center gap-2.5">
          <PiggyBadge className="h-8 w-8" />
          <Wordmark className="text-[15px]" />
          <DemoTag />
        </Link>
      </header>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="More"
            className="absolute inset-x-0 bottom-0 flex max-h-[86%] flex-col rounded-t-card bg-paper px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-lift animate-pop"
          >
            <div className="flex items-center justify-between">
              <Link
                href={APP_HOME}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3"
              >
                <PiggyBadge />
                <Wordmark className="text-[17px]" />
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-cream hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <FrontPageLink onNavigate={() => setDrawerOpen(false)} />
              <TourLink onNavigate={() => setDrawerOpen(false)} />
              <ThemeToggle />
              <UserChip />
            </div>
          </div>
        </div>
      ) : null}

      {/* The bottom bar overlays the page, so the page has to end above it. */}
      <main className="min-w-0 flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-10 lg:px-10 lg:pb-16 xl:px-14">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>

      <BottomNav onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
