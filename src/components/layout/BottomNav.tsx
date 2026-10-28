"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Phone navigation, where a thumb can reach it.
 *
 * A hamburger in the top-right corner is the furthest point on the screen
 * from the hand holding it, and it hides every destination behind a tap. On a
 * phone that is the wrong shape for an app you open for ten seconds to check
 * one number — which is most of what this app is for.
 *
 * Four destinations are permanent and the rest live behind More. They are the
 * first four in the sidebar's own order, which is already sorted by how often
 * someone opens each one, so the bar needs no separate opinion about priority.
 */
const PRIMARY_COUNT = 4;

export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const primary = NAV_ITEMS.slice(0, PRIMARY_COUNT);
  const inMore = !primary.some((item) => item.href === pathname);

  return (
    <nav
      aria-label="Main"
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 border-t border-sand/80 bg-canvas/95 backdrop-blur-md lg:hidden",
        // Clears the home indicator on a phone that has one.
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="flex items-stretch">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-full min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors",
                  active ? "text-litchi" : "text-mist"
                )}
              >
                <Icon className="h-[21px] w-[21px] shrink-0" aria-hidden />
                <span className="w-full truncate text-center text-[10.5px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onMore}
            aria-haspopup="dialog"
            className={clsx(
              "flex h-full min-h-[58px] w-full flex-col items-center justify-center gap-1 px-1 py-2 transition-colors",
              inMore ? "text-litchi" : "text-mist"
            )}
          >
            <MoreHorizontal className="h-[21px] w-[21px] shrink-0" aria-hidden />
            <span className="w-full truncate text-center text-[10.5px] font-medium leading-none">
              More
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
