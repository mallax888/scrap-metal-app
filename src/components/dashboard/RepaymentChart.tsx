"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { plan } from "@/lib/data";
import { formatDate, formatDateShort, formatMonthAxis, money, moneyExact } from "@/lib/format";
import { useLitchi, type ChartPoint } from "@/lib/store";

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number | null;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const point = payload.find((item) => item.value != null);
  if (!point) return null;
  const projected = point.dataKey === "projected";

  return (
    <div className="rounded-xl border border-sand bg-paper px-3.5 py-2.5 shadow-lift">
      <p className="text-xs text-mist">{formatDateShort(label)}</p>
      <p className="numeric mt-1 text-base font-semibold text-ink">
        {moneyExact(point.value ?? 0)}
      </p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-clay">
        {projected ? "Projected balance" : "Balance"}
      </p>
    </div>
  );
}

export function RepaymentChart() {
  const { derived, ready } = useLitchi();
  const data: ChartPoint[] = derived.chart;

  const stats = [
    { label: "Starting balance", value: money(plan.principal), tone: "text-mist" },
    { label: "Current balance", value: moneyExact(derived.balance), tone: "text-ink" },
    {
      label: "Projected completion",
      value: derived.balance <= 0 ? "Paid in full" : formatDate(derived.payoffDate),
      tone: "text-ink",
    },
  ];

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Bond repayment</CardTitle>
          <p className="mt-1 text-sm text-mist">
            Your balance from move-in through to your final payment.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-mist">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-bark" aria-hidden />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-5 rounded-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, var(--color-clay) 0 4px, transparent 4px 7px)",
              }}
              aria-hidden
            />
            Projected
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
              {stat.label}
            </dt>
            <dd className={`numeric mt-1.5 text-[17px] font-semibold ${stat.tone}`}>
              {ready ? stat.value : <Skeleton className="h-5 w-24" />}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 h-[240px] w-full sm:h-[280px]">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="litchi-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-bark)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-bark)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="litchi-projected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-clay)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--color-clay)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-sand)" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatMonthAxis}
                interval="preserveStartEnd"
                minTickGap={44}
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fill: "var(--color-mist)", fontSize: 11 }}
              />
              <YAxis
                domain={[0, plan.principal]}
                tickFormatter={(value: number) => money(value)}
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fill: "var(--color-mist)", fontSize: 11 }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--color-clay)", strokeDasharray: "3 4" }}
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="var(--color-clay)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#litchi-projected)"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-clay)", stroke: "var(--color-paper)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="var(--color-bark)"
                strokeWidth={2.5}
                fill="url(#litchi-actual)"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-bark)", stroke: "var(--color-paper)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>

      <p className="mt-5 rounded-tile bg-cream/60 px-4 py-3 text-sm text-bark">
        {derived.balance <= 0
          ? "Your bond is fully repaid. Nice work."
          : `You’re on track to have your bond fully repaid by ${formatDate(derived.payoffDate)}.`}
        {derived.weeksSaved > 0 && derived.balance > 0 ? (
          <span className="text-mist">
            {" "}
            That{"’"}s {derived.weeksSaved} {derived.weeksSaved === 1 ? "week" : "weeks"} ahead of
            your original plan.
          </span>
        ) : null}
      </p>
    </Card>
  );
}
