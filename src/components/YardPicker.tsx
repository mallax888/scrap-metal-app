"use client";

import { clsx } from "clsx";
import { MapPin } from "lucide-react";
import { MetalId, Yard } from "@/lib/types";
import { formatPricePerKg } from "@/lib/format";

export function YardPicker({
  yards,
  metal,
  selectedYardId,
  onSelect,
}: {
  yards: Yard[];
  metal: MetalId;
  selectedYardId: string | null;
  onSelect: (yardId: string) => void;
}) {
  const sorted = [...yards].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((yard) => {
        const yardPrice = yard.buyPrices[metal];
        const selected = yard.id === selectedYardId;
        return (
          <button
            key={yard.id}
            type="button"
            onClick={() => onSelect(yard.id)}
            className={clsx(
              "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
              selected
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            )}
          >
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="font-medium">{yard.name}</p>
                <p className="text-sm text-zinc-500">
                  {yard.suburb} · {yard.distanceKm.toFixed(1)} km away
                </p>
              </div>
            </div>
            <div className="text-right text-sm font-medium tabular-nums">
              {yardPrice ? formatPricePerKg(yardPrice) : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
