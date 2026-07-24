"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CheckCircle2, Truck, Warehouse } from "lucide-react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { METALS, getMetal } from "@/lib/metals";
import { MetalId, RequestMethod } from "@/lib/types";
import { formatMoney, formatPricePerKg } from "@/lib/format";
import { YardPicker } from "@/components/YardPicker";
import { MetalLabel, MetalSwatch } from "@/components/MetalLabel";

export default function SellPage() {
  const { prices, yards, addRequest } = useApp();
  const { user } = useAuth();
  const router = useRouter();

  const [metal, setMetal] = useState<MetalId>("copper");
  const [weight, setWeight] = useState<number>(10);
  const [method, setMethod] = useState<RequestMethod>("dropoff");
  const [yardId, setYardId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMetal = getMetal(metal);

  const marketPrice = useMemo(
    () => prices.find((p) => p.metal === metal)?.pricePerKg ?? 0,
    [prices, metal]
  );

  const selectedYard = yards.find((y) => y.id === yardId);
  const effectivePrice =
    method === "dropoff" && selectedYard?.buyPrices?.[metal]
      ? (selectedYard.buyPrices[metal] as number)
      : marketPrice;

  const total = effectivePrice * weight;

  const canSubmit =
    weight > 0 && (method === "pickup" ? address.trim().length > 0 : Boolean(yardId));

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await addRequest({
        metal,
        weightKg: weight,
        quotedPricePerKg: effectivePrice,
        quotedTotal: total,
        method,
        yardId: method === "dropoff" ? yardId ?? undefined : undefined,
        yardName: method === "dropoff" ? selectedYard?.name : undefined,
        yardSuburb: method === "dropoff" ? selectedYard?.suburb : undefined,
        address: method === "pickup" ? address.trim() : undefined,
        note: note.trim() || undefined,
      });
      setConfirmedId(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-semibold text-stone-50">Quote locked in</h1>
        <p className="text-stone-400">
          Your <MetalLabel metal={selectedMetal} /> request for {formatMoney(total)} is now in
          the queue. Track its progress from your portfolio.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => router.push("/portfolio")}
            className="rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
          >
            View portfolio
          </button>
          <button
            onClick={() => setConfirmedId(null)}
            className="rounded-full border border-stone-700 px-5 py-2.5 font-medium text-stone-200 hover:bg-stone-800"
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
        <h1 className="text-3xl font-semibold tracking-tight text-stone-50">Sell my scrap</h1>
        <p className="mt-1 text-stone-400">
          Pick your metal and weight for an instant indicative quote.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-300">Metal type</label>
        <div className="flex flex-wrap gap-2">
          {METALS.map((m) => {
            const selected = metal === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetal(m.id)}
                style={selected ? { backgroundColor: m.color, borderColor: m.color } : undefined}
                className={clsx(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
                  selected
                    ? "text-stone-950"
                    : "border-stone-700 text-stone-300 hover:border-stone-500"
                )}
              >
                {!selected && <MetalSwatch metal={m} />}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="weight" className="text-sm font-medium text-stone-300">
          Estimated weight (kg)
        </label>
        <input
          type="range"
          aria-label="Estimated weight slider"
          min={1}
          max={2000}
          value={Math.min(weight, 2000)}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="accent-amber-600"
        />
        <input
          id="weight"
          type="number"
          min={0}
          value={weight}
          onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
          className="w-32 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 tabular-nums text-stone-50"
        />
      </div>

      <div className="rounded-2xl border border-amber-900/60 bg-amber-500/10 p-5">
        <p className="text-sm font-medium text-amber-500">Instant indicative quote</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-stone-50">
          {formatMoney(total)}
        </p>
        <p className="mt-1 text-sm text-stone-400">
          {weight}kg <MetalLabel metal={selectedMetal} className="text-sm" /> ×{" "}
          {formatPricePerKg(effectivePrice)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-300">How do you want to sell it?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("dropoff")}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors",
              method === "dropoff"
                ? "border-amber-600 bg-amber-500/10 text-stone-50"
                : "border-stone-800 text-stone-300"
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
                ? "border-amber-600 bg-amber-500/10 text-stone-50"
                : "border-stone-800 text-stone-300"
            )}
          >
            <Truck className="h-5 w-5" />
            <span className="font-medium">Request pickup</span>
          </button>
        </div>
      </div>

      {method === "dropoff" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-stone-300">Scrap yards</label>
          <p className="text-xs text-stone-500">
            Independent yards, not app partners — rates aren&apos;t live, so your quote
            above uses the current market price. Call ahead to confirm.
          </p>
          <YardPicker yards={yards} metal={metal} selectedYardId={yardId} onSelect={setYardId} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm font-medium text-stone-300">
            Pickup address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Example Street, Suburb"
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-50"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm font-medium text-stone-300">
          Notes (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. mixed copper wire, roughly sorted"
          rows={2}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-50"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
        className="rounded-full bg-amber-600 px-5 py-3 font-medium text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Submitting…"
          : user
            ? "Confirm quote & submit"
            : "Sign in to confirm & submit"}
      </button>
    </div>
  );
}
