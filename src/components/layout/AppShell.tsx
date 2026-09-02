"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { SidebarNav } from "./SidebarNav";
import { UserChip } from "./UserChip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [drawerPath, setDrawerPath] = useState(pathname);

  // Close the drawer whenever the route changes — adjusted during render
  // rather than in an effect, so there is no extra paint with it still open.
  if (drawerOpen && pathname !== drawerPath) {
    setDrawerOpen(false);
    setDrawerPath(pathname);
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
        <Link href="/" className="flex items-center gap-3 px-1.5">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </Link>

        <div className="mt-9 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="mt-6 shrink-0">
          <UserChip />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand/80 bg-canvas/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <PiggyBadge className="h-8 w-8" />
          <Wordmark className="text-[15px]" />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-paper text-ink transition-colors hover:bg-cream"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-paper px-5 py-6 shadow-lift animate-pop">
            <div className="flex items-center justify-between">
              <Link
                href="/"
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
            <div className="mt-8 flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="mt-6">
              <UserChip />
            </div>
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-10 xl:px-14">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
