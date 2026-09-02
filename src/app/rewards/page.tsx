"use client";

import { useState } from "react";
import { Check, Gift, Lock, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ActivityRow } from "@/components/dashboard/ActivityFeed";
import { rewardCatalogue, rewardCategories, rewards, type Reward } from "@/lib/data";
import { points } from "@/lib/format";
import { useLitchi } from "@/lib/store";

export default function RewardsPage() {
  const { derived, state, redeemReward } = useLitchi();
  const toast = useToast();
  const [pending, setPending] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const tierProgress = Math.min(1, derived.pointsBalance / rewards.nextTierAt);
  const rewardActivity = derived.activity.filter((item) => item.kind === "reward");

  async function confirm() {
    if (!pending) return;
    setRedeeming(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const ok = redeemReward(pending.id);
    setRedeeming(false);
    const name = pending.name;
    setPending(null);
    toast(ok ? `${name} redeemed` : "Not enough points yet", ok ? "success" : "info");
  }

  return (
    <>
      <PageHeader
        eyebrow="Litchi Rewards"
        title="Rewards"
        subtitle="Points for paying on time and keeping a strong renter record."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card tone="ink" className="relative h-full overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(110% 80% at 90% 0%, rgba(169,130,106,0.28), transparent 60%)",
                }}
                aria-hidden
              />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
                  Points balance
                </p>
                <p className="numeric mt-4 text-[52px] font-semibold leading-none">
                  {points(derived.pointsBalance)}
                </p>
                <p className="mt-2.5 text-sm text-onbrand/65">
                  <span className="numeric font-semibold text-onbrand">
                    +{points(rewards.earnedThisMonth)}
                  </span>{" "}
                  earned this month
                </p>

                <div className="mt-9 max-w-md">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{rewards.tier} tier</span>
                    <span className="numeric text-onbrand/60">
                      {points(derived.pointsToNextTier)} to {rewards.nextTier}
                    </span>
                  </div>
                  <Progress
                    value={tierProgress}
                    tone="cream"
                    className="mt-3"
                    label="Progress to next tier"
                  />
                </div>
              </div>
            </Card>
          </div>

          <Card className="flex h-full flex-col">
            <CardTitle>How you&rsquo;ve earned</CardTitle>
            <ul className="mt-5 space-y-5">
              {rewardCategories.map((category) => (
                <li key={category.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {category.label}
                    </span>
                    <span className="numeric shrink-0 text-sm font-semibold text-ink">
                      {points(category.earned)}
                    </span>
                  </div>
                  <p className="mt-1.5 pl-[30px] text-xs leading-relaxed text-mist">
                    {category.description}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <section aria-labelledby="catalogue-heading">
          <div className="mb-5">
            <h2 id="catalogue-heading" className="text-lg font-semibold tracking-tight text-ink">
              Spend your points
            </h2>
            <p className="mt-1 text-sm text-mist">
              Rewards built around renting, not airline miles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rewardCatalogue.map((reward) => {
              const affordable = derived.pointsBalance >= reward.cost;
              const redeemed = state.redemptions.some((item) => item.rewardId === reward.id);

              return (
                <Card key={reward.id} interactive className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        affordable ? "bg-cream text-bark" : "bg-canvas text-clay"
                      )}
                    >
                      {affordable ? (
                        <Gift className="h-[18px] w-[18px]" aria-hidden />
                      ) : (
                        <Lock className="h-[18px] w-[18px]" aria-hidden />
                      )}
                    </span>
                    <span className="numeric rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-bark">
                      {points(reward.cost)} pts
                    </span>
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold text-ink">{reward.name}</h3>
                  <p className="mt-2 mb-5 text-sm leading-relaxed text-mist">
                    {reward.description}
                  </p>

                  <div className="mt-auto">
                    {redeemed ? (
                      <Badge tone="moss">
                        <Check className="h-3 w-3" aria-hidden />
                        Redeemed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={affordable ? "primary" : "secondary"}
                        disabled={!affordable}
                        onClick={() => setPending(reward)}
                        className="w-full"
                      >
                        {affordable
                          ? "Redeem"
                          : `${points(reward.cost - derived.pointsBalance)} pts to go`}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card>
          <CardTitle>Rewards activity</CardTitle>
          {rewardActivity.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={Sparkles}
              title="No rewards activity yet"
              description="Points appear here at the end of each month you pay on time."
            />
          ) : (
            <ul className="mt-4 divide-y divide-sand/70">
              {rewardActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </Card>

        <Card tone="cream">
          <CardLabel>Good to know</CardLabel>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
            Points have no cash value and can&rsquo;t be transferred. They&rsquo;re a thank-you for
            paying on time, and they never affect your bond, your balance or the amount you owe.
          </p>
        </Card>
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Redeem reward"
        description={pending ? `${points(pending.cost)} points will come off your balance.` : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)} disabled={redeeming}>
              Cancel
            </Button>
            <Button onClick={confirm} loading={redeeming}>
              {redeeming ? "Redeeming" : "Confirm"}
            </Button>
          </>
        }
      >
        {pending ? (
          <>
            <h3 className="text-[15px] font-semibold text-ink">{pending.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{pending.description}</p>
            <div className="mt-5 flex items-baseline justify-between rounded-tile bg-cream/70 px-4 py-3 text-sm">
              <span className="text-mist">Points after redeeming</span>
              <span className="numeric font-semibold text-ink">
                {points(derived.pointsBalance - pending.cost)}
              </span>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}
