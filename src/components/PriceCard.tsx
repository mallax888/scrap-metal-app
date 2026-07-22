"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Metal, MetalPrice } from "@/lib/types";
import { formatPricePerKg } from "@/lib/format";
import { hexToRgba } from "@/lib/color";
import { MetalLabel, MetalSwatch } from "./MetalLabel";

export function PriceCard({ metal, price }: { metal: Metal; price: MetalPrice }) {
  const up = price.changePct24h >= 0;
  const chartData = price.history.map((value, i) => ({ i, value }));

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/30"
      style={{
        borderColor: hexToRgba(metal.color, 0.4),
        backgroundColor: "#1c1917",
        backgroundImage: `radial-gradient(circle at 10% -10%, ${hexToRgba(metal.color, 0.32)}, transparent 65%)`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: metal.color }}
      />

      <div className="flex items-center gap-2">
        <MetalSwatch metal={metal} />
        <MetalLabel metal={metal} className="text-sm" />
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-stone-50">
          {formatPricePerKg(price.pricePerKg)}
        </span>
        <span
          className={clsx(
            "flex items-center gap-0.5 text-sm font-medium tabular-nums",
            up ? "text-emerald-500" : "text-red-500"
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
