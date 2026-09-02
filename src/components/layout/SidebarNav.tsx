"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors duration-200",
              active
                ? "bg-cream font-semibold text-bark"
                : "font-medium text-mist hover:bg-cream/60 hover:text-ink"
            )}
          >
            <Icon
              className={clsx(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-bark" : "text-clay group-hover:text-bark"
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
