"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CheckCircle2, Truck, Warehouse } from "lucide-react";
import { useApp } from "@/lib/store";
import { METALS } from "@/lib/metals";
import { MetalId, RequestMethod } from "@/lib/types";
import { formatMoney, formatPricePerKg } from "@/lib/format";
import { YardPicker } from "@/components/YardPicker";

export default function SellPage() {
  const { prices, yards, addRequest } = useApp();
  const router = useRouter();

  const [metal, setMetal] = useState<MetalId>("copper");
  const [weight, setWeight] = useState<number>(10);
  const [method, setMethod] = useState<RequestMethod>("dropoff");
  const [yardId, setYardId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const marketPrice = useMemo(
    () => prices.find((p) => p.metal === metal)?.pricePerKg ?? 0,
    [prices, metal]
  );

  const selectedYard = yards.find((y) => y.id === yardId);
  const effectivePrice =
    method === "dropoff" && selectedYard?.buyPrices[metal]
      ? (selectedYard.buyPrices[metal] as number)
      : marketPrice;

  const total = effectivePrice * weight;

  const canSubmit =
    weight > 0 && (method === "pickup" ? address.trim().length > 0 : Boolean(yardId));

  function handleSubmit() {
    if (!canSubmit) return;
    const request = addRequest({
      metal,
      weightKg: weight,
      quotedPricePerKg: effectivePrice,
      quotedTotal: total,
      method,
      yardId: method === "dropoff" ? yardId ?? undefined : undefined,
      address: method === "pickup" ? address.trim() : undefined,
      note: note.trim() || undefined,
    });
    setConfirmedId(request.id);
  }

  if (confirmedId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-semibold">Quote locked in</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your request for {formatMoney(total)} is now in the queue. Track its progress from
          your portfolio.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => router.push("/portfolio")}
            className="rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white hover:bg-emerald-600"
          >
            View portfolio
          </button>
          <button
            onClick={() => setConfirmedId(null)}
            className="rounded-full border border-zinc-200 px-5 py-2.5 font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Sell more
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sell my scrap</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Pick your metal and weight for an instant indicative quote.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Metal type
        </label>
        <div className="flex flex-wrap gap-2">
          {METALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetal(m.id)}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                metal === m.id
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              )}
            >
              <span className={clsx("h-2 w-2 rounded-full", metal === m.id ? "bg-white" : m.swatch)} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="weight" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Estimated weight (kg)
        </label>
        <input
          type="range"
          aria-label="Estimated weight slider"
          min={1}
          max={500}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="accent-emerald-500"
        />
        <input
          id="weight"
          type="number"
          min={0}
          value={weight}
          onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
          className="w-32 rounded-lg border border-zinc-200 px-3 py-1.5 tabular-nums dark:border-zinc-800 dark:bg-zinc-950"
        />
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-500/10">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Instant indicative quote
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
          {formatMoney(total)}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {weight}kg × {formatPricePerKg(effectivePrice)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          How do you want to sell it?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("dropoff")}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors",
              method === "dropoff"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-zinc-200 dark:border-zinc-800"
            )}
          >
            <Warehouse className="h-5 w-5" />
            <span className="font-medium">Drop off</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod("pickup")}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors",
              method === "pickup"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-zinc-200 dark:border-zinc-800"
            )}
          >
            <Truck className="h-5 w-5" />
            <span className="font-medium">Request pickup</span>
          </button>
        </div>
      </div>

      {method === "dropoff" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Nearest yards
          </label>
          <YardPicker yards={yards} metal={metal} selectedYardId={yardId} onSelect={setYardId} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Pickup address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Example Street, Suburb"
            className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Notes (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. mixed copper wire, roughly sorted"
          rows={2}
          className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="rounded-full bg-emerald-500 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirm quote &amp; submit
      </button>
    </div>
  );
}
