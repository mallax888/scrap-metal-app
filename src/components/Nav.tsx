"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Recycle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NAV_LINKS } from "@/lib/nav-links";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-stone-950">
            <Recycle className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">ScrapExchange</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 transition-colors",
                  active
                    ? "bg-amber-600 text-stone-950"
                    : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
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
              <span className="hidden text-stone-400 sm:inline">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-stone-700 px-3 py-1.5 font-medium text-stone-200 hover:bg-stone-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-full border border-stone-700 px-3 py-1.5 font-medium text-stone-200 hover:bg-stone-900"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
