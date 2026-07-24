"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LogIn, PackageOpen } from "lucide-react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getMetal } from "@/lib/metals";
import { formatMoney } from "@/lib/format";
import { StatusTimeline } from "@/components/StatusTimeline";
import { MetalLabel, MetalSwatch } from "@/components/MetalLabel";
import { MetalCard } from "@/components/MetalCard";

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
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-700 p-10 text-center">
        <LogIn className="h-10 w-10 text-stone-500" />
        <h1 className="text-xl font-semibold text-stone-50">Sign in to see your portfolio</h1>
        <p className="text-stone-400">
          Your sales history is tied to your account so it follows you across devices.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-700 p-10 text-center">
        <PackageOpen className="h-10 w-10 text-stone-500" />
        <h1 className="text-xl font-semibold text-stone-50">No sales yet</h1>
        <p className="text-stone-400">
          Get an instant quote and your first request will show up here.
        </p>
        <Link
          href="/sell"
          className="mt-2 rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
        >
          Sell my scrap
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-50">My Portfolio</h1>
        <p className="mt-1 text-stone-400">Your scrap sales history, tracked like holdings.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <p className="text-sm text-stone-500">Sold in {stats.year}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-50">
            {formatMoney(stats.totalSold)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <p className="text-sm text-stone-500">Requests</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-50">
            {stats.dropoffs}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <p className="text-sm text-stone-500">Total weight sold</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-50">
            {stats.totalKg.toFixed(1)} kg
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {requests.map((r) => {
          const metal = getMetal(r.metal);
          return (
            <MetalCard key={r.id} metal={metal} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MetalSwatch metal={metal} />
                  <MetalLabel metal={metal} className="text-sm" />
                  <span className="text-sm text-stone-500">
                    · {r.weightKg}kg · {r.method === "pickup" ? "Pickup" : "Drop-off"}
                    {r.method === "dropoff" && r.yardName && ` at ${r.yardName}`}
                    {r.method === "pickup" && r.address && ` — ${r.address}`}
                  </span>
                </div>
                <div className="text-lg font-semibold tabular-nums text-stone-50">
                  {formatMoney(r.quotedTotal)}
                </div>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {r.method === "dropoff" && r.yardSuburb ? `${r.yardSuburb} · ` : ""}
                {new Date(r.createdAt).toLocaleString("en-NZ")}
              </p>
              <div className="mt-4">
                <StatusTimeline status={r.status} />
              </div>
            </MetalCard>
          );
        })}
      </div>
    </div>
  );
}
