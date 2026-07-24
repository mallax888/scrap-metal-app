"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_LINKS } from "@/lib/nav-links";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-800 bg-stone-950/95 backdrop-blur sm:hidden">
      <div className="flex items-stretch justify-around">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-amber-500" : "text-stone-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
