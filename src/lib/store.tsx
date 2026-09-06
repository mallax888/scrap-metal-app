"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createLocalStore } from "./local-store";
import {
  POINTS,
  TODAY,
  baseActivity,
  baseRepaid,
  movingFund,
  originalEndDate,
  paymentMethods,
  plan,
  repaymentHistory,
  rewardCatalogue,
  SCORE_EFFECTS,
  renterScore,
  rewardTiers,
  rewards,
  scoreBand,
  scoreFactors,
  weeklyPaymentsMade,
  tenancy,
  type ActivityItem,
  type RewardTier,
  type ScoreFactor,
} from "./data";
import { addDays, addWeeks, daysBetween } from "./format";

/* ------------------------------------------------------------------ */
/* Persisted state                                                     */
/* ------------------------------------------------------------------ */

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  /**
   * Catching up a missed payment is not the same act as choosing to pay ahead,
   * even though both land in the ledger as an extra payment. Without the
   * distinction, missing a week and then paying it would earn the "paid ahead"
   * reward points and nudge the score up — leaving someone better off than if
   * they had never missed it at all.
   */
  kind?: "extra" | "catchup";
}

/**
 * A payment that failed, and where Litchi has got to about it.
 *
 * The stages are derived from the missed payment's date rather than stored, so
 * the renter is never shown a vague "we'll be in touch" — they can see exactly
 * what happens and when. Nothing here charges a fee: a late fee on a product
 * for people who could not find a bond charges the least able to pay for being
 * least able to pay.
 */
export interface MissedStage {
  key: string;
  label: string;
  detail: string;
  date: string;
  done: boolean;
}

export interface MissedPayment {
  date: string;
  amount: number;
  daysAgo: number;
  stages: MissedStage[];
}

export interface Redemption {
  id: string;
  rewardId: string;
  date: string;
  cost: number;
  name: string;
}

export interface LitchiState {
  extraPayments: LedgerEntry[];
  fundContributions: LedgerEntry[];
  redemptions: Redemption[];
  activePaymentMethodId: string;
  autoTopUp: boolean;
  waitlist: string[];
  /**
   * A payment the renter asked to move before it was due. Free, and the whole
   * point of the feature: the cheapest missed payment is the one someone tells
   * you about in advance.
   */
  movedPayment: { from: string; to: string } | null;
  /** A payment that failed. The demo can trigger this to show what happens. */
  missedPayment: string | null;
}

const INITIAL_STATE: LitchiState = {
  extraPayments: [],
  fundContributions: [],
  redemptions: [],
  activePaymentMethodId: paymentMethods[0].id,
  autoTopUp: true,
  waitlist: [],
  movedPayment: null,
  missedPayment: null,
};

const store = createLocalStore<LitchiState>("litchi.state.v1", INITIAL_STATE);

/* ------------------------------------------------------------------ */
/* Derived plan maths                                                  */
/* ------------------------------------------------------------------ */

export interface ScheduledPayment {
  date: string;
  amount: number;
  isFinal: boolean;
}

export interface ChartPoint {
  date: string;
  actual: number | null;
  projected: number | null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PlanProjection {
  totalRepaid: number;
  balance: number;
  progress: number;
  weeksRemaining: number;
  payoffDate: string;
  weeksSaved: number;
}

/**
 * The one place repayment maths lives, so the dashboard and the "what would an
 * extra payment do?" preview can never drift apart.
 *
 * The payoff date is the date of the last remaining payment — counted forward
 * in weeks from the next one — not a date written down anywhere. Paying extra
 * removes payments off the end, which pulls the date back on its own.
 */
export function projectPlan(totalRepaidInput: number): PlanProjection {
  const totalRepaid = Math.min(plan.totalRepayable, Math.max(0, round2(totalRepaidInput)));
  const balance = round2(plan.totalRepayable - totalRepaid);
  const weeksRemaining =
    balance <= 0 ? 0 : Math.max(1, Math.round(balance / plan.weeklyPayment));
  const payoffDate =
    weeksRemaining === 0 ? TODAY : addWeeks(plan.nextPaymentDate, weeksRemaining - 1);
  return {
    totalRepaid,
    balance,
    progress: totalRepaid / plan.totalRepayable,
    weeksRemaining,
    payoffDate,
    weeksSaved: Math.max(0, Math.round(daysBetween(payoffDate, originalEndDate) / 7)),
  };
}

function buildSchedule(
  balance: number,
  weeks: number,
  firstDate: string,
  payoffDate: string
): ScheduledPayment[] {
  if (weeks <= 0 || balance <= 0) return [];
  const schedule: ScheduledPayment[] = [];
  for (let i = 0; i < weeks; i += 1) {
    const isFinal = i === weeks - 1;
    schedule.push({
      // The final row is dated by the projected payoff so the plan and the
      // headline projection can never disagree.
      date: isFinal ? payoffDate : addWeeks(firstDate, i),
      amount: isFinal ? round2(balance - plan.weeklyPayment * (weeks - 1)) : plan.weeklyPayment,
      isFinal,
    });
  }
  return schedule;
}

function buildChartSeries(
  extraPayments: LedgerEntry[],
  balanceNow: number,
  schedule: ScheduledPayment[]
): ChartPoint[] {
  const paid = [
    ...repaymentHistory.map((entry) => ({ date: entry.date, amount: entry.amount })),
    ...extraPayments.map((entry) => ({ date: entry.date, amount: entry.amount })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));

  const points: ChartPoint[] = [
    { date: tenancy.startDate, actual: plan.totalRepayable, projected: null },
  ];

  let running: number = plan.totalRepayable;
  for (const entry of paid) {
    running = round2(running - entry.amount);
    const last = points[points.length - 1];
    // Several payments can land on one day (an extra payment made today);
    // collapse them so the line stays monotonic and readable.
    if (last.date === entry.date) last.actual = running;
    else points.push({ date: entry.date, actual: running, projected: null });
  }

  // Bridge point: shared by both series so the line has no visual break.
  const bridge = points[points.length - 1];
  bridge.projected = bridge.actual;

  // The projection walks the real schedule, so the line lands on zero exactly
  // on the payoff date the rest of the UI quotes.
  let projected = balanceNow;
  for (const payment of schedule) {
    projected = round2(Math.max(0, projected - payment.amount));
    points.push({ date: payment.date, actual: null, projected });
  }

  return points;
}

export interface LitchiDerived {
  /** Bond finance */
  totalRepaid: number;
  balance: number;
  progress: number;
  weeksRemaining: number;
  payoffDate: string;
  weeksSaved: number;
  schedule: ScheduledPayment[];
  chart: ChartPoint[];
  nextPayment: ScheduledPayment | null;
  extraPaid: number;
  /** Trouble, and what is being done about it */
  movedPayment: { from: string; to: string } | null;
  missedPayment: MissedPayment | null;
  /** Renter score, derived from behaviour rather than stated. */
  score: {
    value: number;
    band: string;
    change: number;
    factors: ScoreFactor[];
    history: { month: string; value: number }[];
  };
  /** Moving Fund */
  fundSaved: number;
  fundProgress: number;
  fundRemaining: number;
  /** Rewards */
  pointsBalance: number;
  /** Points ever earned. Drives tier status; never goes down. */
  lifetimeEarned: number;
  tier: RewardTier;
  nextTier: RewardTier | null;
  pointsToNextTier: number;
  /** When the next tier arrives if on-time payments simply continue. */
  nextTierDate: string | null;
  redemptions: Redemption[];
  /** Housing */
  totalWeeklyHousing: number;
  /** Feed */
  activity: ActivityItem[];
}

function derive(state: LitchiState): LitchiDerived {
  const extraPaid = round2(state.extraPayments.reduce((sum, e) => sum + e.amount, 0));
  const { totalRepaid, balance, progress, weeksRemaining, payoffDate, weeksSaved } =
    projectPlan(baseRepaid + extraPaid);
  const schedule = buildSchedule(balance, weeksRemaining, plan.nextPaymentDate, payoffDate);

  const fundAdded = round2(state.fundContributions.reduce((sum, e) => sum + e.amount, 0));
  const fundSaved = round2(movingFund.baseSaved + fundAdded);

  /*
   * Two separate numbers, deliberately.
   *
   * Lifetime earned only ever grows, and it is what tier status runs on.
   * Spending is tracked apart from it, so redeeming a reward reduces what you
   * can spend without pushing you back down the ladder — deriving status from
   * the balance would have meant using the programme demoted you, which
   * punishes the one behaviour it exists to encourage.
   */
  const voluntaryExtras = state.extraPayments.filter((e) => e.kind !== "catchup");
  const earnedFromExtras = voluntaryExtras.reduce(
    (sum, e) => sum + Math.floor(e.amount / 50) * POINTS.perFiftyPaidEarly,
    0
  );
  const earnedFromFund = state.fundContributions.length * POINTS.perFundTopUp;
  const lifetimeEarned = rewards.basePoints + earnedFromExtras + earnedFromFund;

  const spent = state.redemptions.reduce((sum, r) => sum + r.cost, 0);
  const pointsBalance = lifetimeEarned - spent;

  const tier =
    [...rewardTiers].reverse().find((t) => lifetimeEarned >= t.at) ?? rewardTiers[0];
  const nextTier = rewardTiers.find((t) => t.at > lifetimeEarned) ?? null;
  const pointsToNextTier = nextTier ? nextTier.at - lifetimeEarned : 0;
  /*
   * Counted forward from the next payment at the on-time rate alone, so it is
   * the date you reach the tier by doing nothing but keeping up — never a
   * promise that depends on extra payments the renter has not made.
   */
  const nextTierDate = nextTier
    ? addWeeks(
        plan.nextPaymentDate,
        Math.max(0, Math.ceil(pointsToNextTier / POINTS.perOnTimePayment) - 1)
      )
    : null;

  /*
   * A missed payment and the staged response to it. Every date counts from the
   * payment itself, so someone in trouble can see what happens next without
   * having to ring and ask.
   */
  const missedDate = state.missedPayment;
  const missedPayment: MissedPayment | null = missedDate
    ? {
        date: missedDate,
        amount: plan.weeklyPayment,
        daysAgo: Math.max(0, daysBetween(missedDate, TODAY)),
        stages: (
          [
            [
              "missed",
              "Payment didn't go through",
              "Your bank declined it. Nothing was charged for the attempt.",
              0,
            ],
            [
              "notice",
              "We let you know",
              "A message, not a demand. No fee, and nothing reported to anyone.",
              1,
            ],
            [
              "retry",
              "We try once more",
              "A single retry, on a day you pick. We never re-present it over and over.",
              4,
            ],
            [
              "talk",
              "A person gets in touch",
              "To agree a plan that works — not to chase you.",
              8,
            ],
          ] as const
        ).map(([key, label, detail, afterDays]) => ({
          key,
          label,
          detail,
          date: addDays(missedDate, afterDays),
          done: Math.max(0, daysBetween(missedDate, TODAY)) >= afterDays,
        })),
      }
    : null;

  /*
   * The score, derived rather than stated.
   *
   * It sat at a hardcoded 94 while the dashboard could be showing a failed
   * payment right beside it — and the Score page promises in as many words
   * that missing one costs you. A number that never moves is not a signal,
   * it is decoration, and it is the first thing a sceptical reader pokes.
   */
  const missedNow = state.missedPayment !== null;
  const paymentsOnTime = weeklyPaymentsMade - (missedNow ? 1 : 0);

  const factors: ScoreFactor[] = scoreFactors.map((factor) => {
    let value = factor.value;
    let detail = factor.detail;

    if (factor.key === "payment-history") {
      if (missedNow) {
        value += SCORE_EFFECTS.missedPaymentHistory;
        detail = `${paymentsOnTime} of ${weeklyPaymentsMade + 1} payments made on time.`;
      }
      value += voluntaryExtras.length * SCORE_EFFECTS.extraPaymentHistory;
    }
    if (factor.key === "consistency" && missedNow) {
      value += SCORE_EFFECTS.missedConsistency;
      detail = "One missed payment. This recovers as you keep paying on time.";
    }

    return { ...factor, value: Math.max(0, Math.min(100, value)), detail };
  });

  const scoreValue = Math.round(
    factors.reduce((sum, factor) => sum + factor.value * factor.weight, 0)
  );
  /* The last history point is this month, so it tracks the live figure. */
  const scoreHistory = renterScore.history.map((point, index) =>
    index === renterScore.history.length - 1 ? { ...point, value: scoreValue } : { ...point }
  );
  const previousMonth = renterScore.history[renterScore.history.length - 2].value;

  const score = {
    value: scoreValue,
    band: scoreBand(scoreValue),
    change: scoreValue - previousMonth,
    factors,
    history: scoreHistory,
  };

  const userActivity: ActivityItem[] = [
    ...state.extraPayments.map((entry) => ({
      id: entry.id,
      date: entry.date,
      kind: "extra" as const,
      title: "Extra payment",
      detail: "One-off payment towards your balance",
      amount: entry.amount,
    })),
    ...state.fundContributions.map((entry) => ({
      id: entry.id,
      date: entry.date,
      kind: "fund" as const,
      title: "Moving Fund top-up",
      detail: "Added by you",
      amount: entry.amount,
    })),
    ...state.redemptions.map((entry) => ({
      id: entry.id,
      date: entry.date,
      kind: "reward" as const,
      title: `Redeemed — ${entry.name}`,
      detail: "Litchi Rewards",
      points: -entry.cost,
    })),
  ];

  return {
    totalRepaid,
    balance,
    progress,
    weeksRemaining,
    payoffDate,
    weeksSaved,
    schedule,
    chart: buildChartSeries(state.extraPayments, balance, schedule),
    nextPayment: schedule[0] ?? null,
    movedPayment: state.movedPayment,
    missedPayment,
    score,
    extraPaid,
    fundSaved,
    fundProgress: Math.min(1, fundSaved / movingFund.goal),
    fundRemaining: Math.max(0, round2(movingFund.goal - fundSaved)),
    pointsBalance,
    lifetimeEarned,
    tier,
    nextTier,
    pointsToNextTier,
    nextTierDate,
    redemptions: [...state.redemptions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    totalWeeklyHousing: round2(tenancy.rentWeekly + plan.weeklyPayment),
    activity: [...userActivity, ...baseActivity].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export interface LitchiActions {
  makeExtraPayment: (amount: number) => void;
  addToMovingFund: (amount: number) => void;
  redeemReward: (rewardId: string) => boolean;
  setPaymentMethod: (id: string) => void;
  toggleAutoTopUp: () => void;
  toggleWaitlist: (productId: string) => void;
  /** Move an upcoming payment to a later date. Free, and always allowed. */
  movePayment: (toDate: string) => void;
  /** Pay a missed payment now and clear the arrears state. */
  catchUpPayment: () => void;
  /** Demo only: show what a failed payment looks like, or put it back. */
  setMissedPayment: (date: string | null) => void;
  reset: () => void;
}

interface LitchiContextValue extends LitchiActions {
  state: LitchiState;
  derived: LitchiDerived;
  /** False for the first moment after mount, so screens can show skeletons. */
  ready: boolean;
}

const LitchiContext = createContext<LitchiContextValue | null>(null);

/** Only the very first mount shows the loading state, not every navigation. */
let hasLoadedOnce = false;

export function LitchiProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [ready, setReady] = useState(hasLoadedOnce);

  useEffect(() => {
    if (hasLoadedOnce) return;
    const timer = window.setTimeout(() => {
      hasLoadedOnce = true;
      setReady(true);
    }, 550);
    return () => window.clearTimeout(timer);
  }, []);

  const makeExtraPayment = useCallback((amount: number) => {
    if (!(amount > 0)) return;
    store.setState((prev) => ({
      ...prev,
      extraPayments: [
        ...prev.extraPayments,
        { id: `extra_${Date.now()}`, date: TODAY, amount: round2(amount) },
      ],
    }));
  }, []);

  const addToMovingFund = useCallback((amount: number) => {
    if (!(amount > 0)) return;
    store.setState((prev) => ({
      ...prev,
      fundContributions: [
        ...prev.fundContributions,
        { id: `fund_${Date.now()}`, date: TODAY, amount: round2(amount) },
      ],
    }));
  }, []);

  const redeemReward = useCallback((rewardId: string) => {
    const reward = rewardCatalogue.find((item) => item.id === rewardId);
    if (!reward) return false;
    const current = derive(store.getSnapshot()).pointsBalance;
    if (current < reward.cost) return false;
    store.setState((prev) => ({
      ...prev,
      redemptions: [
        ...prev.redemptions,
        {
          id: `redeem_${Date.now()}`,
          rewardId,
          date: TODAY,
          cost: reward.cost,
          name: reward.name,
        },
      ],
    }));
    return true;
  }, []);

  const setPaymentMethod = useCallback((id: string) => {
    store.setState((prev) => ({ ...prev, activePaymentMethodId: id }));
  }, []);

  const toggleAutoTopUp = useCallback(() => {
    store.setState((prev) => ({ ...prev, autoTopUp: !prev.autoTopUp }));
  }, []);

  const movePayment = useCallback((toDate: string) => {
    store.setState((prev) => ({
      ...prev,
      movedPayment: { from: plan.nextPaymentDate, to: toDate },
      // Moving a payment before it is due is the opposite of missing one, so
      // it clears any arrears state rather than sitting alongside it.
      missedPayment: null,
    }));
  }, []);

  const catchUpPayment = useCallback(() => {
    store.setState((prev) => {
      if (!prev.missedPayment) return prev;
      return {
        ...prev,
        missedPayment: null,
        extraPayments: [
          ...prev.extraPayments,
          {
            id: `catchup_${Date.now()}`,
            date: TODAY,
            amount: plan.weeklyPayment,
            kind: "catchup" as const,
          },
        ],
      };
    });
  }, []);

  const setMissedPayment = useCallback((date: string | null) => {
    store.setState((prev) => ({ ...prev, missedPayment: date }));
  }, []);

  const toggleWaitlist = useCallback((productId: string) => {
    store.setState((prev) => ({
      ...prev,
      waitlist: prev.waitlist.includes(productId)
        ? prev.waitlist.filter((id) => id !== productId)
        : [...prev.waitlist, productId],
    }));
  }, []);

  const reset = useCallback(() => store.setState(INITIAL_STATE), []);

  const value = useMemo<LitchiContextValue>(
    () => ({
      state,
      derived: derive(state),
      ready,
      makeExtraPayment,
      addToMovingFund,
      redeemReward,
      setPaymentMethod,
      toggleAutoTopUp,
      toggleWaitlist,
      movePayment,
      catchUpPayment,
      setMissedPayment,
      reset,
    }),
    [
      state,
      ready,
      movePayment,
      catchUpPayment,
      setMissedPayment,
      makeExtraPayment,
      addToMovingFund,
      redeemReward,
      setPaymentMethod,
      toggleAutoTopUp,
      toggleWaitlist,
      reset,
    ]
  );

  return <LitchiContext.Provider value={value}>{children}</LitchiContext.Provider>;
}

export function useLitchi(): LitchiContextValue {
  const context = useContext(LitchiContext);
  if (!context) throw new Error("useLitchi must be used inside <LitchiProvider>");
  return context;
}

export function useActivePaymentMethod() {
  const { state } = useLitchi();
  return (
    paymentMethods.find((method) => method.id === state.activePaymentMethodId) ??
    paymentMethods[0]
  );
}
