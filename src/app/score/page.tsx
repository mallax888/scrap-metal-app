"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Progress, ProgressRing } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { renterScore, scoreFactors } from "@/lib/data";
import { percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const TIPS = [
  {
    title: "Keep every payment on time",
    body: "Payment history is the heaviest factor. Nine on-time payments in a row is already doing the work.",
  },
  {
    title: "Let your tenancy history build",
    body: "Tenancy history is your lowest factor simply because Litchi has only seen one tenancy so far. It rises on its own.",
  },
  {
    title: "Tell us early if a week is tight",
    body: "Moving a payment before it's due keeps your record clean. A missed payment doesn't.",
  },
];

const MONTH_LABELS: Record<string, string> = {
  "2026-03": "Mar",
  "2026-04": "Apr",
  "2026-05": "May",
  "2026-06": "Jun",
  "2026-07": "Jul",
  "2026-08": "Aug",
  "2026-09": "Sep",
};

function ScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand bg-paper px-3.5 py-2.5 shadow-lift">
      <p className="text-xs text-mist">{label ? MONTH_LABELS[label] ?? label : ""}</p>
      <p className="numeric mt-1 text-base font-semibold text-ink">{payload[0].value} / 100</p>
    </div>
  );
}

export default function ScorePage() {
  const { ready } = useLitchi();
  const history = renterScore.history.map((point) => ({ ...point }));

  return (
    <>
      <PageHeader
        eyebrow="Litchi Score"
        title="Renter Score"
        subtitle="Litchi's own read on how you're tracking as a renter."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-start">
            <CardLabel>Your Litchi Score</CardLabel>
            <div className="mt-6 flex items-center gap-6">
              <ProgressRing value={renterScore.value / 100} size={112} stroke={9}>
                <span className="numeric text-[30px] font-semibold text-ink">
                  {renterScore.value}
                </span>
              </ProgressRing>
              <div>
                <p className="numeric text-sm text-mist">out of 100</p>
                <p className="mt-1 text-[19px] font-semibold text-ink">{renterScore.band}</p>
                <div className="mt-3 flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-moss-soft px-2.5 py-1 text-[13px] font-medium text-moss">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  <span className="numeric">+{renterScore.change}</span>
                  <span className="font-normal">{renterScore.changeWindow}</span>
                </div>
              </div>
            </div>

            <p className="mt-auto pt-8 text-xs leading-relaxed text-mist">
              A strong renter profile can unlock better Litchi offers in the future — a larger Bond
              Assist limit, or a longer term if you need one.
            </p>
          </Card>

          <div className="lg:col-span-2">
            <Card className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Score over time</CardTitle>
                  <p className="mt-1 text-sm text-mist">Updated at the start of each month.</p>
                </div>
                <Badge tone="moss">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  Up {renterScore.value - history[0].value} since March
                </Badge>
              </div>

              <div className="mt-6 h-[220px] w-full">
                {ready ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <XAxis
                        dataKey="month"
                        tickFormatter={(value: string) => MONTH_LABELS[value] ?? value}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fill: "var(--color-mist)", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[70, 100]}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tick={{ fill: "var(--color-mist)", fontSize: 11 }}
                      />
                      <Tooltip
                        content={<ScoreTooltip />}
                        cursor={{ stroke: "var(--color-clay)", strokeDasharray: "3 4" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-bark)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "var(--color-bark)", strokeWidth: 0 }}
                        activeDot={{
                          r: 5,
                          fill: "var(--color-bark)",
                          stroke: "var(--color-paper)",
                          strokeWidth: 2,
                        }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full" />
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardTitle>What goes into it</CardTitle>
          <p className="mt-1 text-sm text-mist">
            Four factors, weighted. Payment history and tenancy history carry the most.
          </p>

          <dl className="mt-7 grid gap-7 md:grid-cols-2">
            {scoreFactors.map((factor) => (
              <div key={factor.key}>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[15px] font-medium text-ink">{factor.label}</dt>
                  <dd className="numeric text-[15px] font-semibold text-ink">
                    {factor.value}
                    <span className="text-sm font-normal text-mist"> / 100</span>
                  </dd>
                </div>
                <Progress
                  value={factor.value / 100}
                  className="mt-2.5"
                  label={`${factor.label} score`}
                />
                <p className="mt-2.5 flex items-baseline justify-between gap-4 text-xs text-mist">
                  <span>{factor.detail}</span>
                  <span className="numeric shrink-0">{percent(factor.weight)} weighting</span>
                </p>
              </div>
            ))}
          </dl>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIPS.map((tip) => (
            <Card key={tip.title} tone="cream">
              <h3 className="text-[15px] font-semibold text-ink">{tip.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{tip.body}</p>
            </Card>
          ))}
        </div>

        <Card className="flex gap-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
          <p className="text-sm leading-relaxed text-mist">
            <span className="font-semibold text-ink">This is not a credit score.</span> The Litchi
            Score is Litchi&rsquo;s own measure of how you&rsquo;re tracking with us. It is not a
            legally recognised credit score, it isn&rsquo;t reported to credit bureaux, and it has
            no effect on your credit file.
          </p>
        </Card>
      </div>
    </>
  );
}
