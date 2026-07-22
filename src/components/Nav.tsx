"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Recycle } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Market" },
  { href: "/sell", label: "Sell Scrap" },
  { href: "/portfolio", label: "My Portfolio" },
  { href: "/dealer", label: "Dealer Dashboard" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Recycle className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">ScrapExchange</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm font-medium">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 transition-colors",
                  active
                    ? "bg-emerald-500 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          {loading ? null : user ? (
            <>
              <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-full border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
