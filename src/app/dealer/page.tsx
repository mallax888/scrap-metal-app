"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Inbox, Tags } from "lucide-react";
import { useApp } from "@/lib/store";
import { METALS, getMetal } from "@/lib/metals";
import { RequestStatus } from "@/lib/types";
import { formatMoney, formatPricePerKg } from "@/lib/format";

const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  quoted: "scheduled",
  scheduled: "collected",
  collected: "paid",
};

const NEXT_LABEL: Partial<Record<RequestStatus, string>> = {
  quoted: "Accept & schedule",
  scheduled: "Mark collected",
  collected: "Mark paid",
};

export default function DealerPage() {
  const { demoYards, requests, prices, updateYardPrice, updateRequestStatus } = useApp();
  const [yardId, setYardId] = useState(demoYards[0]?.id ?? "");
  const [tab, setTab] = useState<"prices" | "requests">("requests");

  const yard = demoYards.find((y) => y.id === yardId) ?? demoYards[0];
  const relevantRequests = requests.filter(
    (r) => r.method === "pickup" || r.yardId === yard?.id
  );
  const openRequests = relevantRequests.filter((r) => r.status !== "paid");
  const completedRequests = relevantRequests.filter((r) => r.status === "paid");

  if (!yard) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dealer Dashboard</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Manage your buy prices and incoming requests. Sandbox yards for now —
            real yards join once dealer onboarding exists.
          </p>
        </div>
        <select
          value={yardId}
          onChange={(e) => setYardId(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
        >
          {demoYards.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 rounded-full border border-zinc-200 p-1 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setTab("requests")}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
            tab === "requests" ? "bg-emerald-500 text-white" : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          <Inbox className="h-4 w-4" />
          Incoming ({openRequests.length})
        </button>
        <button
          onClick={() => setTab("prices")}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
            tab === "prices" ? "bg-emerald-500 text-white" : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          <Tags className="h-4 w-4" />
          Buy prices
        </button>
      </div>

      {tab === "prices" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METALS.map((m) => {
            const marketPrice = prices.find((p) => p.metal === m.id)?.pricePerKg ?? 0;
            const yardPrice = yard.buyPrices?.[m.id] ?? marketPrice;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${m.swatch}`} />
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-zinc-500">Market: {formatPricePerKg(marketPrice)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={yardPrice}
                    onChange={(e) => updateYardPrice(yard.id, m.id, Number(e.target.value))}
                    className="w-24 rounded-lg border border-zinc-200 px-2 py-1.5 text-right tabular-nums dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <span className="text-zinc-400">/kg</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {openRequests.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-700">
              No open requests right now.
            </p>
          )}
          {openRequests.map((r) => {
            const metal = getMetal(r.metal);
            const next = NEXT_STATUS[r.status];
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${metal.swatch}`} />
                  <div>
                    <p className="font-medium">
                      {metal.label} · {r.weightKg}kg
                    </p>
                    <p className="text-xs text-zinc-500">
                      {r.method === "pickup" ? `Pickup — ${r.address}` : "Drop-off"} ·{" "}
                      {formatMoney(r.quotedTotal)} · {r.status}
                    </p>
                  </div>
                </div>
                {next && (
                  <button
                    onClick={() => {
                      updateRequestStatus(r.id, next).catch((err) =>
                        console.error("Failed to update request status", err)
                      );
                    }}
                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    {NEXT_LABEL[r.status]}
                  </button>
                )}
              </div>
            );
          })}
          {completedRequests.length > 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              {completedRequests.length} completed request{completedRequests.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
