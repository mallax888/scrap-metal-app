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
  TODAY,
  baseActivity,
  movingFund,
  paymentMethods,
  plan,
  repaymentHistory,
  rewardCatalogue,
  rewards,
  tenancy,
  type ActivityItem,
} from "./data";
import { addWeeks } from "./format";

/* ------------------------------------------------------------------ */
/* Persisted state                                                     */
/* ------------------------------------------------------------------ */

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
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
}

const INITIAL_STATE: LitchiState = {
  extraPayments: [],
  fundContributions: [],
  redemptions: [],
  activePaymentMethodId: paymentMethods[0].id,
  autoTopUp: true,
  waitlist: [],
};

const store = createLocalStore<LitchiState>("litchi.state.v1", INITIAL_STATE);

/* ------------------------------------------------------------------ */
/* Derived plan maths                                                  */
/* ------------------------------------------------------------------ */

/** Weeks left on the untouched sample plan — the baseline the payoff date hangs off. */
const BASE_WEEKS_REMAINING = Math.round(
  (plan.principal - plan.baseRepaid) / plan.weeklyPayment
);

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
 */
export function projectPlan(totalRepaidInput: number): PlanProjection {
  const totalRepaid = Math.min(plan.principal, Math.max(0, round2(totalRepaidInput)));
  const balance = round2(plan.principal - totalRepaid);
  const weeksRemaining =
    balance <= 0 ? 0 : Math.max(1, Math.round(balance / plan.weeklyPayment));
  const weeksSaved = Math.max(0, BASE_WEEKS_REMAINING - weeksRemaining);
  return {
    totalRepaid,
    balance,
    progress: totalRepaid / plan.principal,
    weeksRemaining,
    payoffDate: addWeeks(plan.agreedEndDate, -weeksSaved),
    weeksSaved,
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
    { date: tenancy.startDate, actual: plan.principal, projected: null },
  ];

  let running: number = plan.principal;
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
  /** Moving Fund */
  fundSaved: number;
  fundProgress: number;
  fundRemaining: number;
  /** Rewards */
  pointsBalance: number;
  pointsToNextTier: number;
  /** Housing */
  totalWeeklyHousing: number;
  /** Feed */
  activity: ActivityItem[];
}

function derive(state: LitchiState): LitchiDerived {
  const extraPaid = round2(state.extraPayments.reduce((sum, e) => sum + e.amount, 0));
  const { totalRepaid, balance, progress, weeksRemaining, payoffDate, weeksSaved } =
    projectPlan(plan.baseRepaid + extraPaid);
  const schedule = buildSchedule(balance, weeksRemaining, plan.nextPaymentDate, payoffDate);

  const fundAdded = round2(state.fundContributions.reduce((sum, e) => sum + e.amount, 0));
  const fundSaved = round2(movingFund.baseSaved + fundAdded);

  const spent = state.redemptions.reduce((sum, r) => sum + r.cost, 0);
  const pointsBalance = rewards.basePoints - spent;

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
    extraPaid,
    fundSaved,
    fundProgress: Math.min(1, fundSaved / movingFund.goal),
    fundRemaining: Math.max(0, round2(movingFund.goal - fundSaved)),
    pointsBalance,
    pointsToNextTier: Math.max(0, rewards.nextTierAt - pointsBalance),
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
      reset,
    }),
    [
      state,
      ready,
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
