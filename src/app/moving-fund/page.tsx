"use client";

import { useState } from "react";
import { Boxes, Sparkles, Truck, Wallet } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ActivityRow } from "@/components/dashboard/ActivityFeed";
import { MovingFundModal } from "@/components/modals/MovingFundModal";
import { movingFund } from "@/lib/data";
import { formatDate, money, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const USES = [
  { icon: Wallet, title: "Your next bond", body: "Move without financing it, if you'd rather." },
  { icon: Truck, title: "Movers and a van", body: "The part of moving nobody budgets for." },
  { icon: Boxes, title: "Setting up", body: "Connection fees, a bed that fits, the first shop." },
];

export default function MovingFundPage() {
  const { derived, state, toggleAutoTopUp } = useLitchi();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const contributions = derived.activity.filter((item) => item.kind === "fund");
  const weeksToGoal =
    state.autoTopUp && derived.fundRemaining > 0
      ? Math.ceil(derived.fundRemaining / movingFund.autoTopUp)
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Moving Fund"
        title="Your next move starts here."
        subtitle="Money put aside for moving day. Separate from your bond, and yours to withdraw any time."
        actions={<Button onClick={() => setOpen(true)}>Add to Moving Fund</Button>}
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card tone="cream" className="flex h-full flex-col">
              <CardLabel>Balance</CardLabel>
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="numeric text-[46px] font-semibold leading-none text-ink">
                  {money(derived.fundSaved)}
                </span>
                <span className="numeric text-sm text-mist">of {money(movingFund.goal)} goal</span>
              </div>

              <Progress
                value={derived.fundProgress}
                size="lg"
                className="mt-7"
                label="Moving Fund progress"
              />

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 text-sm">
                <p className="text-bark">
                  You&rsquo;re{" "}
                  <span className="numeric font-semibold">{percent(derived.fundProgress)}</span> of
                  the way toward your next move.
                </p>
                <p className="numeric text-mist">{money(derived.fundRemaining)} to go</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-8">
                <Button onClick={() => setOpen(true)}>Add to Moving Fund</Button>
                <Button variant="secondary" onClick={() => toast("Withdrawals arrive in 1–2 business days", "info")}>
                  Withdraw
                </Button>
              </div>
            </Card>
          </div>

          <Card className="flex h-full flex-col">
            <CardTitle>Automatic top-ups</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Add {money(movingFund.autoTopUp)} every week alongside your Litchi payment. Pause it
              any time.
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={state.autoTopUp}
              onClick={() => {
                toggleAutoTopUp();
                toast(
                  state.autoTopUp ? "Automatic top-ups paused" : "Automatic top-ups on",
                  state.autoTopUp ? "info" : "success"
                );
              }}
              className="mt-6 flex items-center justify-between gap-4 rounded-tile border border-sand bg-canvas px-4 py-3.5 text-left transition-colors hover:bg-cream/40"
            >
              <span>
                <span className="block text-sm font-medium text-ink">
                  {money(movingFund.autoTopUp)} per week
                </span>
                <span className="block text-xs text-mist">
                  {state.autoTopUp ? "Active" : "Paused"}
                </span>
              </span>
              <span
                className={clsx(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                  state.autoTopUp ? "bg-brand" : "bg-sand"
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow-sm transition-transform duration-200",
                    state.autoTopUp ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </span>
            </button>

            {weeksToGoal ? (
              <p className="mt-auto pt-6 text-xs leading-relaxed text-mist">
                At {money(movingFund.autoTopUp)} a week you&rsquo;ll reach{" "}
                {money(movingFund.goal)} in about {weeksToGoal} weeks.
              </p>
            ) : (
              <p className="mt-auto pt-6 text-xs leading-relaxed text-mist">
                Turn top-ups back on to keep building without thinking about it.
              </p>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {USES.map((use) => {
            const Icon = use.icon;
            return (
              <Card key={use.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{use.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{use.body}</p>
              </Card>
            );
          })}
        </div>

        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <CardTitle>Contributions</CardTitle>
            <p className="text-sm text-mist">
              Opened {formatDate(movingFund.openedDate)}
            </p>
          </div>

          {contributions.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={Sparkles}
              title="No contributions yet"
              description="Add your first amount and it'll show up here."
              action={
                <Button size="sm" onClick={() => setOpen(true)}>
                  Add to Moving Fund
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 divide-y divide-sand/70">
              {contributions.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}

          <p className="mt-6 text-xs leading-relaxed text-mist">
            Your Moving Fund is held separately from your bond and from your Litchi repayments.
            Adding to it never changes what you owe.
          </p>
        </Card>
      </div>

      <MovingFundModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
