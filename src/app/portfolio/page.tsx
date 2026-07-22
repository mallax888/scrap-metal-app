"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LogIn, PackageOpen } from "lucide-react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getMetal } from "@/lib/metals";
import { formatMoney } from "@/lib/format";
import { StatusTimeline } from "@/components/StatusTimeline";

export default function PortfolioPage() {
  const { requests, requestsLoading } = useApp();
  const { user, loading: authLoading } = useAuth();

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const yearRequests = requests.filter(
      (r) => new Date(r.createdAt).getFullYear() === thisYear
    );
    const totalSold = yearRequests.reduce((sum, r) => sum + r.quotedTotal, 0);
    const dropoffs = yearRequests.length;
    const totalKg = yearRequests.reduce((sum, r) => sum + r.weightKg, 0);
    return { totalSold, dropoffs, totalKg, year: thisYear };
  }, [requests]);

  if (authLoading || (user && requestsLoading)) {
    return null;
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <LogIn className="h-10 w-10 text-zinc-400" />
        <h1 className="text-xl font-semibold">Sign in to see your portfolio</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your sales history is tied to your account so it follows you across devices.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white hover:bg-emerald-600"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <PackageOpen className="h-10 w-10 text-zinc-400" />
        <h1 className="text-xl font-semibold">No sales yet</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Get an instant quote and your first request will show up here.
        </p>
        <Link
          href="/sell"
          className="mt-2 rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white hover:bg-emerald-600"
        >
          Sell my scrap
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Portfolio</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your scrap sales history, tracked like holdings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Sold in {stats.year}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatMoney(stats.totalSold)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Requests</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{stats.dropoffs}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Total weight sold</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{stats.totalKg.toFixed(1)} kg</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {requests.map((r) => {
          const metal = getMetal(r.metal);
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${metal.swatch}`} />
                  <span className="font-medium">{metal.label}</span>
                  <span className="text-sm text-zinc-500">
                    · {r.weightKg}kg · {r.method === "pickup" ? "Pickup" : "Drop-off"}
                  </span>
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {formatMoney(r.quotedTotal)}
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(r.createdAt).toLocaleString("en-NZ")}
              </p>
              <div className="mt-4">
                <StatusTimeline status={r.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
