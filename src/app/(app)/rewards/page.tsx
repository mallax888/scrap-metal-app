"use client";

import { useState } from "react";
import { ArrowRight, Check, Gift, Lock, Sparkles, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCelebrate } from "@/components/ui/Celebration";
import { useToast } from "@/components/ui/Toast";
import { ActivityRow } from "@/components/dashboard/ActivityFeed";
import {
  POINTS,
  rewardCatalogue,
  rewardCategories,
  rewardTiers,
  rewards,
  type Reward,
} from "@/lib/data";
import { formatDate, money, points } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/** Where a tier sits in the ladder, for comparing a reward's gate to yours. */
const tierRank = (key: string) => rewardTiers.findIndex((t) => t.key === key);

export default function RewardsPage() {
  const { derived, state, redeemReward } = useLitchi();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [pending, setPending] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const { tier, nextTier, lifetimeEarned } = derived;
  // Progress across the current band, not from zero — otherwise the bar barely
  // moves once you are a few tiers up.
  const tierProgress = nextTier
    ? Math.min(1, (lifetimeEarned - tier.at) / (nextTier.at - tier.at))
    : 1;
  const rewardActivity = derived.activity.filter((item) => item.kind === "reward");
  const myRank = tierRank(tier.key);

  async function confirm() {
    if (!pending) return;
    setRedeeming(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const ok = redeemReward(pending.id);
    setRedeeming(false);
    const name = pending.name;
    const cost = pending.cost;
    setPending(null);

    if (ok) {
      celebrate({
        title: "Reward unlocked.",
        message: `${name} is yours. We'll be in touch with the details.`,
        stat: `${points(cost)} points redeemed`,
      });
    } else {
      toast("Not enough points yet", "info");
    }
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
                <p className="numeric mt-4 text-[52px] font-semibold leading-none tracking-[-0.02em]">
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
                    <span className="font-medium">{tier.name} tier</span>
                    <span className="numeric text-onbrand/60">
                      {nextTier
                        ? `${points(derived.pointsToNextTier)} to ${nextTier.name}`
                        : "Top tier"}
                    </span>
                  </div>
                  <Progress
                    value={tierProgress}
                    tone="cream"
                    className="mt-3"
                    label="Progress to next tier"
                  />

                  {/*
                    The page was a ledger: everything on it described points
                    already banked and nothing said what happens next. This is
                    the one line that turns it into a reason to keep going, and
                    it is counted from the on-time rate alone — never from extra
                    payments the renter has not actually made.
                  */}
                  {nextTier && derived.nextTierDate ? (
                    <p className="mt-4 flex items-start gap-2 text-sm text-onbrand/70">
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        Keep paying on time and you reach{" "}
                        <span className="font-semibold text-onbrand">{nextTier.name}</span> on{" "}
                        <span className="font-semibold text-onbrand">
                          {formatDate(derived.nextTierDate)}
                        </span>
                        .
                      </span>
                    </p>
                  ) : null}
                </div>

                <p className="mt-8 text-xs leading-relaxed text-onbrand/45">
                  <span className="numeric">{points(lifetimeEarned)}</span>{" "}
                  earned all up. Tier status runs on what you&rsquo;ve earned, so spending points
                  never moves you back down.
                </p>
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

            <div className="mt-6 rounded-tile bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                Also earns
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-mist">
                <li>
                  <span className="numeric font-semibold text-ink">
                    +{POINTS.perFiftyPaidEarly}
                  </span>{" "}
                  for every {money(50)} paid ahead of schedule
                </li>
                <li>
                  <span className="numeric font-semibold text-ink">+{POINTS.perReferral}</span> for
                  each renter you refer who takes a bond
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Tier ladder — a tier that promises nothing is decoration. */}
        <section aria-labelledby="tiers-heading">
          <div className="mb-5">
            <h2 id="tiers-heading" className="text-lg font-semibold tracking-tight text-ink">
              What the tiers get you
            </h2>
            <p className="mt-1 text-sm text-mist">
              Based on points earned over the life of your account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {rewardTiers.map((t, index) => {
              const reached = lifetimeEarned >= t.at;
              const current = t.key === tier.key;
              return (
                <Card
                  key={t.key}
                  tone={current ? "cream" : "paper"}
                  className={clsx("flex flex-col", current && "ring-1 ring-bark/25")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-ink">{t.name}</h3>
                    {current ? (
                      <Badge tone="moss">
                        <Check className="h-3 w-3" aria-hidden />
                        You&rsquo;re here
                      </Badge>
                    ) : (
                      <span className="numeric text-xs font-semibold text-clay">
                        {points(t.at)}
                      </span>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-mist"
                      >
                        {reached ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                        ) : (
                          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                        )}
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  {index < rewardTiers.length - 1 ? null : null}
                </Card>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="catalogue-heading">
          <div className="mb-5">
            <h2 id="catalogue-heading" className="text-lg font-semibold tracking-tight text-ink">
              Spend your points
            </h2>
            <p className="mt-1 text-sm text-mist">
              Rewards built around renting, not airline miles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rewardCatalogue.map((reward) => {
              const unlocked = tierRank(reward.tier) <= myRank;
              const affordable = derived.pointsBalance >= reward.cost;
              const available = unlocked && affordable;
              const redeemed = state.redemptions.some((item) => item.rewardId === reward.id);
              const gate = rewardTiers[tierRank(reward.tier)];

              return (
                <Card key={reward.id} interactive className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        available ? "bg-cream text-bark" : "bg-canvas text-clay"
                      )}
                    >
                      {available ? (
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
                        variant={available ? "primary" : "secondary"}
                        disabled={!available}
                        onClick={() => setPending(reward)}
                        className="w-full"
                      >
                        {available
                          ? "Redeem"
                          : !unlocked
                            ? `${gate.name} tier`
                            : `${points(reward.cost - derived.pointsBalance)} pts to go`}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/*
            Worth saying outright. A payment pause used to sit in this list at
            5,000 points — more than a whole tenancy can earn, and sold to the
            people least likely to have saved them. Deferring a week when money
            is tight is a hardship provision, not a prize.
          */}
          <div className="mt-4 flex items-start gap-3 rounded-card border border-sand/70 bg-paper p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss-soft text-moss">
              <Check className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">
                Need to move a payment? That&rsquo;s not a reward.
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">
                If a week is going to be tight, tell us before it&rsquo;s due and we&rsquo;ll move
                it. It costs no points, it&rsquo;s open to everyone, and it doesn&rsquo;t touch your
                Litchi Score.
              </p>
            </div>
          </div>
        </section>

        {/* What you've claimed, and what happened to it. */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Redemptions</CardTitle>
            {derived.redemptions.length === 0 ? (
              <EmptyState
                className="mt-5"
                icon={Gift}
                title="Nothing redeemed yet"
                description="Rewards you claim show up here, along with what happens next."
              />
            ) : (
              <ul className="mt-4 divide-y divide-sand/70">
                {derived.redemptions.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                      <p className="numeric mt-0.5 text-xs text-mist">
                        {formatDate(item.date)} · {points(item.cost)} pts
                      </p>
                    </div>
                    <Badge tone="moss">
                      <Check className="h-3 w-3" aria-hidden />
                      Applied
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

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
        </div>

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
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-mist">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
              Your {tier.name} tier is unaffected — it runs on points earned, not points left.
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}
