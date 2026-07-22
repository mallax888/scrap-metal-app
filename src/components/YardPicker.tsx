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
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="w-fit rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <option value="all">All regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
        {grouped.map(([regionName, regionYards]) => (
          <div key={regionName} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
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
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div>
                      <p className="font-medium">{yard.name}</p>
                      <p className="text-sm text-zinc-500">{yard.suburb}</p>
                      {yard.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                          <Phone className="h-3 w-3" />
                          {yard.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums">
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
