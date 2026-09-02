/**
 * Sample data for the Litchi prototype.
 *
 * Litchi's first product is *bond financing*: a lending partner pays the
 * tenant's bond up front, the statutory bond is lodged with Tenancy Services,
 * and the tenant repays Litchi a fixed amount each week. Rent is a separate
 * payment to the landlord and is never described as a Litchi repayment.
 *
 * Every date and amount here sits on one real schedule: 52 weekly payments,
 * taken every Friday from 17 July 2026. "Today" is a payment Friday, the next
 * payment is the Friday after it, and the payoff date is derived from the
 * remaining payments rather than written down.
 */

import { addWeeks } from "./format";

/**
 * The prototype runs against a fixed "today" so the sample data stays coherent:
 * Friday 18 September 2026, the day payment 10 of 52 was taken.
 */
export const TODAY = "2026-09-18";

export const renter = {
  firstName: "Malcolm",
  lastName: "Moffett",
  displayName: "Malcolm M.",
  role: "Renter",
  initials: "MM",
  memberSince: "2026-03-02",
} as const;

export const tenancy = {
  property: "12 Example Street",
  suburb: "Mount Eden, Auckland",
  startDate: "2026-07-14",
  landlordAgency: "Example Property Co.",
  rentWeekly: 700,
  rentDay: "Friday",
} as const;

export const bond = {
  amount: 2800,
  bondId: "NZB-284731",
  lodgedWith: "Tenancy Services",
  lodgedDate: "2026-07-14",
  status: "Lodged with Tenancy Services",
  weeksOfRent: 4,
} as const;

/**
 * The financed side of the bond: 52 weekly payments of $53.85, with the last
 * one trimmed to settle the balance at exactly $2,800.
 */
export const plan = {
  principal: 2800,
  weeklyPayment: 53.85,
  termWeeks: 52,
  nextPaymentDate: "2026-09-25",
  /** First repayment — the Friday after the tenancy started. */
  startDate: "2026-07-17",
  establishmentFee: 0,
  interestRate: 0,
  partner: "Kōwhai Finance Ltd",
  agreementRef: "LB-2026-284731",
} as const;

/**
 * Where the original 52-payment schedule would have finished, with no extra
 * payments. Derived, so it can never drift from the term or the start date.
 */
export const originalEndDate = addWeeks(plan.startDate, plan.termWeeks - 1);

export const rent = {
  weekly: tenancy.rentWeekly,
  paidTo: tenancy.landlordAgency,
  method: "Automatic payment from your bank",
  nextDue: "2026-09-04",
} as const;

export interface PaymentMethod {
  id: string;
  brand: string;
  label: string;
  last4: string;
  expiry: string;
  kind: "card" | "bank";
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: "pm_visa_4821",
    brand: "Visa",
    label: "Visa",
    last4: "4821",
    expiry: "09/29",
    kind: "card",
  },
  {
    id: "pm_bank_0042",
    brand: "ANZ",
    label: "ANZ everyday account",
    last4: "0042",
    expiry: "—",
    kind: "bank",
  },
];

/**
 * Repayments to date: payments 1-10 of 52, every Friday from 17 July 2026.
 * Ten payments x $53.85 is the $538.50 (19%) shown on the dashboard.
 */
export const repaymentHistory: { date: string; amount: number; kind: "repayment" | "extra" }[] = [
  "2026-07-17",
  "2026-07-24",
  "2026-07-31",
  "2026-08-07",
  "2026-08-14",
  "2026-08-21",
  "2026-08-28",
  "2026-09-04",
  "2026-09-11",
  "2026-09-18",
].map((date) => ({ date, amount: plan.weeklyPayment, kind: "repayment" as const }));

/** On-time weekly payments made so far — drives the score and rewards copy. */
const weeklyPaymentsMade = repaymentHistory.filter((entry) => entry.kind === "repayment").length;

/** Repaid to date, summed from the history rather than stated separately. */
export const baseRepaid = repaymentHistory.reduce(
  (sum, entry) => Math.round((sum + entry.amount) * 100) / 100,
  0
);

export interface ScoreFactor {
  key: string;
  label: string;
  value: number;
  weight: number;
  detail: string;
}

/**
 * Litchi's own renter score. Weights are chosen so the factors below round to
 * the headline 94 — this is a Litchi product signal, not a credit score.
 */
export const scoreFactors: ScoreFactor[] = [
  {
    key: "payment-history",
    label: "Payment history",
    value: 98,
    weight: 0.35,
    detail: `${weeklyPaymentsMade} of ${weeklyPaymentsMade} weekly payments made on time.`,
  },
  {
    key: "consistency",
    label: "Consistency",
    value: 95,
    weight: 0.2,
    detail: "No missed or rescheduled payments since you joined.",
  },
  {
    key: "profile",
    label: "Profile completeness",
    value: 100,
    weight: 0.1,
    detail: "Identity, income and tenancy details all verified.",
  },
  {
    key: "tenancy-history",
    label: "Tenancy history",
    value: 89,
    weight: 0.35,
    detail: "1 verified tenancy. This grows as your history with Litchi does.",
  },
];

export const renterScore = {
  value: Math.round(scoreFactors.reduce((sum, f) => sum + f.value * f.weight, 0)),
  band: "Excellent",
  change: 2,
  changeWindow: "in the last 30 days",
  history: [
    { month: "2026-03", value: 84 },
    { month: "2026-04", value: 86 },
    { month: "2026-05", value: 88 },
    { month: "2026-06", value: 90 },
    { month: "2026-07", value: 91 },
    { month: "2026-08", value: 92 },
    { month: "2026-09", value: 94 },
  ],
} as const;

export interface RewardCategory {
  key: string;
  label: string;
  earned: number;
  description: string;
}

/** 40 points per on-time payment, so September's three so far are the +120 shown. */
const POINTS_PER_PAYMENT = 40;

export const rewardCategories: RewardCategory[] = [
  {
    key: "on-time",
    label: "On-time payments",
    earned: weeklyPaymentsMade * POINTS_PER_PAYMENT,
    description: `${POINTS_PER_PAYMENT} points for every repayment made on time.`,
  },
  {
    key: "history",
    label: "Consistent renter history",
    earned: 440,
    description: "Earned as your verified tenancy record grows.",
  },
  {
    key: "profile",
    label: "Completed profile",
    earned: 400,
    description: "One-off bonus for verifying your identity, income and tenancy details.",
  },
];

export const rewards = {
  /** Always the sum of the categories above — never a number of its own. */
  basePoints: rewardCategories.reduce((sum, category) => sum + category.earned, 0),
  /** Three on-time payments so far in September. */
  earnedThisMonth: 3 * POINTS_PER_PAYMENT,
  tier: "Grove",
  nextTier: "Orchard",
  nextTierAt: 1500,
};

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export const rewardCatalogue: Reward[] = [
  {
    id: "rw_repayment_credit",
    name: "$10 repayment credit",
    description: "Comes off your next weekly Litchi payment.",
    cost: 500,
  },
  {
    id: "rw_moving_fund",
    name: "$25 Moving Fund top-up",
    description: "Straight into your Moving Fund balance.",
    cost: 1000,
  },
  {
    id: "rw_end_clean",
    name: "End-of-tenancy clean",
    description: "A professional clean booked for your final week.",
    cost: 3500,
  },
  {
    id: "rw_payment_pause",
    name: "One-week payment pause",
    description: "Skip a week without affecting your renter score.",
    cost: 5000,
  },
];

/** $500 opening deposit plus nine weekly $20 top-ups = the $680 balance. */
const FUND_OPENING_DEPOSIT = 500;
const FUND_TOP_UP_DATES = [
  "2026-07-24",
  "2026-07-31",
  "2026-08-07",
  "2026-08-14",
  "2026-08-21",
  "2026-08-28",
  "2026-09-04",
  "2026-09-11",
  "2026-09-18",
];

export const movingFund = {
  autoTopUp: 20,
  goal: 2500,
  openedDate: "2026-07-21",
  get baseSaved() {
    return FUND_OPENING_DEPOSIT + FUND_TOP_UP_DATES.length * this.autoTopUp;
  },
};

export type ActivityKind = "repayment" | "extra" | "reward" | "bond" | "fund";

export interface ActivityItem {
  id: string;
  date: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  amount?: number;
  points?: number;
}

const historyActivity: ActivityItem[] = repaymentHistory.map((entry, index) => ({
  id: `act_pay_${index}`,
  date: entry.date,
  kind: entry.kind,
  title: entry.kind === "extra" ? "Extra payment" : "Weekly bond repayment",
  detail: entry.kind === "extra" ? "One-off payment towards your balance" : "Visa •••• 4821",
  amount: entry.amount,
}));

/** Non-payment events, woven into the full activity feed. */
const milestoneActivity: ActivityItem[] = [
  {
    id: "act_reward_sep",
    date: TODAY,
    kind: "reward",
    title: "Litchi Rewards earned",
    detail: "On-time payments — September",
    points: rewards.earnedThisMonth,
  },
  ...FUND_TOP_UP_DATES.map((date, index) => ({
    id: `act_fund_${index}`,
    date,
    kind: "fund" as const,
    title: "Moving Fund top-up",
    detail: "Automatic weekly top-up",
    amount: movingFund.autoTopUp,
  })),
  {
    id: "act_fund_opening",
    date: movingFund.openedDate,
    kind: "fund",
    title: "Moving Fund opened",
    detail: "Opening deposit",
    amount: FUND_OPENING_DEPOSIT,
  },
  {
    id: "act_bond_lodged",
    date: bond.lodgedDate,
    kind: "bond",
    title: "Bond lodged with Tenancy Services",
    detail: `Bond ID ${bond.bondId}`,
    amount: bond.amount,
  },
];

export const baseActivity: ActivityItem[] = [...historyActivity, ...milestoneActivity].sort(
  (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
);

export type DocumentCategory = "Tenancy" | "Bond" | "Litchi" | "Statements" | "Insurance";

export interface LitchiDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  date: string;
  size: string;
}

export const documents: LitchiDocument[] = [
  {
    id: "doc_tenancy",
    name: "Tenancy agreement — 12 Example Street",
    category: "Tenancy",
    date: "2026-07-14",
    size: "412 KB",
  },
  {
    id: "doc_bond_receipt",
    name: "Bond lodgement receipt",
    category: "Bond",
    date: "2026-07-14",
    size: "96 KB",
  },
  {
    id: "doc_bond_form",
    name: "Tenancy Services bond form",
    category: "Bond",
    date: "2026-07-14",
    size: "184 KB",
  },
  {
    id: "doc_agreement",
    name: "Litchi Bond Assist agreement",
    category: "Litchi",
    date: "2026-07-14",
    size: "228 KB",
  },
  {
    id: "doc_disclosure",
    name: "Key information & disclosure statement",
    category: "Litchi",
    date: "2026-07-14",
    size: "154 KB",
  },
  {
    id: "doc_schedule",
    name: "Repayment schedule",
    category: "Litchi",
    date: "2026-07-17",
    size: "88 KB",
  },
  {
    id: "doc_stmt_aug",
    name: "Monthly statement — August 2026",
    category: "Statements",
    date: "2026-09-01",
    size: "72 KB",
  },
  {
    id: "doc_stmt_jul",
    name: "Monthly statement — July 2026",
    category: "Statements",
    date: "2026-08-01",
    size: "68 KB",
  },
];

export const documentCategories: DocumentCategory[] = [
  "Tenancy",
  "Bond",
  "Litchi",
  "Statements",
  "Insurance",
];

export interface EcosystemProduct {
  id: string;
  name: string;
  blurb: string;
  status: "live" | "soon" | "planned";
}

/** What Litchi becomes after Bond Assist — surfaced, honestly labelled. */
export const ecosystem: EcosystemProduct[] = [
  {
    id: "eco_bond",
    name: "Bond Assist",
    blurb: "Your bond paid up front, repaid weekly.",
    status: "live",
  },
  {
    id: "eco_rent",
    name: "Rent payments",
    blurb: "Pay rent and your Litchi repayment in one place.",
    status: "soon",
  },
  {
    id: "eco_insurance",
    name: "Contents insurance",
    blurb: "Cover priced for renters, not homeowners.",
    status: "soon",
  },
  {
    id: "eco_utilities",
    name: "Utilities",
    blurb: "Power and broadband connected on moving day.",
    status: "planned",
  },
  {
    id: "eco_moving",
    name: "Moving services",
    blurb: "Vetted movers, booked and paid through Litchi.",
    status: "planned",
  },
  {
    id: "eco_furniture",
    name: "Furniture finance",
    blurb: "Spread the cost of setting up your place.",
    status: "planned",
  },
];

export const faqs = [
  {
    q: "Who actually holds my bond?",
    a: "Tenancy Services does. Litchi's lending partner paid your bond up front and your landlord lodged it with Tenancy Services in the normal way. Litchi never holds your statutory bond.",
  },
  {
    q: "Is my Litchi payment part of my rent?",
    a: "No. Rent is paid to your landlord or property manager. Your Litchi payment repays the bond that was paid on your behalf, and is shown separately everywhere in the app.",
  },
  {
    q: "What happens to my bond at the end of the tenancy?",
    a: "It is refunded by Tenancy Services under the usual process. If you still owe Litchi anything at that point, the balance is settled then — we'll walk you through it well before your tenancy ends.",
  },
  {
    q: "Can I pay it off early?",
    a: "Yes, any time, with no early repayment fee. Use “Make extra payment” and your remaining weeks and payoff date update straight away.",
  },
  {
    q: "Is the Litchi Score a credit score?",
    a: "No. It is Litchi's own view of how you're tracking as a renter and is not a legally recognised credit score. It has no effect on your credit file.",
  },
  {
    q: "What if I can't make a payment?",
    a: "Talk to us before the payment date. We can move a payment or set up a short pause — doing it in advance means it won't count against your Litchi Score.",
  },
];
