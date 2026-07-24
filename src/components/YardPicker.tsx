"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { MapPin, Phone } from "lucide-react";
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
  const regions = useMemo(
    () => Array.from(new Set(yards.map((y) => y.region))).sort(),
    [yards]
  );
  const [region, setRegion] = useState<string>("all");

  const grouped = useMemo(() => {
    const filtered = region === "all" ? yards : yards.filter((y) => y.region === region);
    const byRegion = new Map<string, Yard[]>();
    for (const yard of filtered) {
      const list = byRegion.get(yard.region) ?? [];
      list.push(yard);
      byRegion.set(yard.region, list);
    }
    for (const list of byRegion.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return Array.from(byRegion.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [yards, region]);

  return (
    <div className="flex flex-col gap-3">
      <select
        aria-label="Filter yards by region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="w-fit rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-50"
      >
        <option value="all">All regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-3">
        {grouped.map(([regionName, regionYards]) => (
          <div key={regionName} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {regionName}
            </p>
            {regionYards.map((yard) => {
              const yardPrice = yard.buyPrices?.[metal];
              const selected = yard.id === selectedYardId;
              return (
                <button
                  key={yard.id}
                  type="button"
                  onClick={() => onSelect(yard.id)}
                  className={clsx(
                    "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
                    selected
                      ? "border-amber-600 bg-amber-500/10"
                      : "border-stone-800 hover:border-stone-600"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
                    <div>
                      <p className="font-medium text-stone-100">{yard.name}</p>
                      <p className="text-sm text-stone-500">{yard.suburb}</p>
                      {yard.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                          <Phone className="h-3 w-3" />
                          {yard.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums text-stone-300">
                    {yardPrice ? formatPricePerKg(yardPrice) : "Contact for rate"}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
