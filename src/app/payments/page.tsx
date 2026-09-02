"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { NextPaymentCard } from "@/components/dashboard/NextPaymentCard";
import { ActivityRow } from "@/components/dashboard/ActivityFeed";
import { ExtraPaymentModal } from "@/components/modals/ExtraPaymentModal";
import { plan, type ActivityKind } from "@/lib/data";
import { formatDayShort, money, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const FILTERS: { key: string; label: string; kinds?: ActivityKind[] }[] = [
  { key: "all", label: "All" },
  { key: "repayments", label: "Bond repayments", kinds: ["repayment"] },
  { key: "extra", label: "Extra payments", kinds: ["extra"] },
  { key: "fund", label: "Moving Fund", kinds: ["fund"] },
  { key: "rewards", label: "Rewards", kinds: ["reward"] },
];

export default function PaymentsPage() {
  const { derived, ready } = useLitchi();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [extraOpen, setExtraOpen] = useState(false);

  const active = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return derived.activity
      .filter((item) => (active.kinds ? active.kinds.includes(item.kind) : true))
      .filter((item) =>
        term === ""
          ? true
          : `${item.title} ${item.detail ?? ""}`.toLowerCase().includes(term)
      );
  }, [derived.activity, active, query]);

  const upcoming = derived.schedule.slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Bond Assist"
        title="Payments"
        subtitle="Everything you've paid Litchi, and everything still to come."
        actions={<Button onClick={() => setExtraOpen(true)}>Make extra payment</Button>}
      />

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <NextPaymentCard />

          <div className="xl:col-span-2">
            <Card className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Upcoming payments</CardTitle>
                  <p className="mt-1 text-sm text-mist">
                    {derived.weeksRemaining} payments left · {moneyExact(derived.balance)} to go
                  </p>
                </div>
                <span className="numeric rounded-full bg-cream px-3 py-1.5 text-[13px] font-medium text-bark">
                  {money(plan.weeklyPayment)} every Friday
                </span>
              </div>

              {ready ? (
                <ul className="mt-5 divide-y divide-sand/70">
                  {upcoming.map((payment, index) => (
                    <li
                      key={payment.date}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="numeric flex h-7 w-7 items-center justify-center rounded-full bg-cream text-[11px] font-semibold text-bark">
                          {index + 1}
                        </span>
                        <span className="text-sm text-ink">{formatDayShort(payment.date)}</span>
                        {index === 0 ? (
                          <span className="rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-moss">
                            Next
                          </span>
                        ) : null}
                      </span>
                      <span className="numeric text-sm font-semibold text-ink">
                        {moneyExact(payment.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 space-y-2.5">
                  {[0, 1, 2, 3, 4].map((key) => (
                    <Skeleton key={key} className="h-10 w-full" />
                  ))}
                </div>
              )}

              {derived.schedule.length > upcoming.length ? (
                <p className="mt-auto pt-5 text-xs text-mist">
                  Showing the next {upcoming.length} of {derived.schedule.length} payments. The
                  final payment clears any rounding left on your balance.
                </p>
              ) : null}
            </Card>
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle>Activity</CardTitle>
            <label className="relative flex w-full max-w-xs items-center sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-clay" aria-hidden />
              <span className="sr-only">Search activity</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity"
                className="h-10 w-full rounded-full border border-sand bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-mist focus:border-clay"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={clsx(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  filter === item.key
                    ? "bg-bark text-cream"
                    : "border border-sand bg-paper text-mist hover:bg-cream hover:text-bark"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!ready ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={SlidersHorizontal}
              title="No activity matches"
              description="Try a different filter, or clear your search to see everything."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 divide-y divide-sand/70">
              {items.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ExtraPaymentModal open={extraOpen} onClose={() => setExtraOpen(false)} />
    </>
  );
}
