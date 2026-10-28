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
 * Four destinations are permanent and the rest live behind More. The sidebar's
 * order mostly decides which four, since it is already sorted by how often
 * each screen is opened — except that the bond trades places with the Moving
 * Fund here. The bond is reference material: where it is lodged and what its
 * number is, looked up once and then never again. The fund is a weekly habit
 * now that round-ups feed it, and a habit two taps behind a More menu is not
 * a habit.
 */
const PRIMARY: string[] = ["/my-tenancy", "/plan", "/payments", "/moving-fund"];

export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const primary = PRIMARY.map((href) =>
    NAV_ITEMS.find((item) => item.href === href)
  ).filter((item): item is (typeof NAV_ITEMS)[number] => item !== undefined);
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
