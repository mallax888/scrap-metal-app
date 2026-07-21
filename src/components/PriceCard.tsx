"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Metal, MetalPrice } from "@/lib/types";
import { formatPricePerKg } from "@/lib/format";

export function PriceCard({ metal, price }: { metal: Metal; price: MetalPrice }) {
  const up = price.changePct24h >= 0;
  const chartData = price.history.map((value, i) => ({ i, value }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <span className={clsx("h-2.5 w-2.5 rounded-full", metal.swatch)} />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {metal.label}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {formatPricePerKg(price.pricePerKg)}
        </span>
        <span
          className={clsx(
            "flex items-center gap-0.5 text-sm font-medium tabular-nums",
            up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(price.changePct24h).toFixed(2)}%
        </span>
      </div>

      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={up ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
