"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Inbox, Tags } from "lucide-react";
import { useApp } from "@/lib/store";
import { METALS, getMetal } from "@/lib/metals";
import { RequestStatus } from "@/lib/types";
import { formatMoney, formatPricePerKg } from "@/lib/format";
import { MetalLabel, MetalSwatch } from "@/components/MetalLabel";

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
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">
            Dealer Dashboard
          </h1>
          <p className="mt-1 text-stone-400">
            Manage your buy prices and incoming requests. Sandbox yards for now —
            real yards join once dealer onboarding exists.
          </p>
        </div>
        <select
          value={yardId}
          onChange={(e) => setYardId(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-50"
        >
          {demoYards.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-fit gap-1 rounded-full border border-stone-800 p-1">
        <button
          onClick={() => setTab("requests")}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
            tab === "requests" ? "bg-amber-600 text-stone-950" : "text-stone-400"
          )}
        >
          <Inbox className="h-4 w-4" />
          Incoming ({openRequests.length})
        </button>
        <button
          onClick={() => setTab("prices")}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
            tab === "prices" ? "bg-amber-600 text-stone-950" : "text-stone-400"
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
                className="flex items-center justify-between rounded-xl border border-stone-800 p-4"
              >
                <div className="flex items-center gap-2">
                  <MetalSwatch metal={m} />
                  <div>
                    <MetalLabel metal={m} className="text-sm" />
                    <p className="text-xs text-stone-500">
                      Market: {formatPricePerKg(marketPrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-stone-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={yardPrice}
                    onChange={(e) => updateYardPrice(yard.id, m.id, Number(e.target.value))}
                    className="w-24 rounded-lg border border-stone-700 bg-stone-900 px-2 py-1.5 text-right tabular-nums text-stone-50"
                  />
                  <span className="text-stone-500">/kg</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {openRequests.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-700 p-6 text-center text-stone-500">
              No open requests right now.
            </p>
          )}
          {openRequests.map((r) => {
            const metal = getMetal(r.metal);
            const next = NEXT_STATUS[r.status];
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-800 p-4"
              >
                <div className="flex items-center gap-2">
                  <MetalSwatch metal={metal} />
                  <div>
                    <p className="font-medium text-stone-100">
                      <MetalLabel metal={metal} className="text-sm" /> · {r.weightKg}kg
                    </p>
                    <p className="text-xs text-stone-500">
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
                    className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-500"
                  >
                    {NEXT_LABEL[r.status]}
                  </button>
                )}
              </div>
            );
          })}
          {completedRequests.length > 0 && (
            <p className="mt-2 text-sm text-stone-500">
              {completedRequests.length} completed request{completedRequests.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
