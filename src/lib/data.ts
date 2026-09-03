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

/*
 * The points economy.
 *
 * Litchi lends the bond at 0% with no establishment fee, so the money for a
 * rewards programme has to come out of a thin margin. A giveback of 1-2% of
 * principal is the realistic ceiling — on a $2,800 bond that is $28-56 across
 * the whole term. Everything below is sized to land inside that.
 *
 * One point is worth about two cents, improving as redemptions get larger,
 * which is the usual shape: the programme can afford to be more generous per
 * point when it is buying a bigger commitment.
 *
 * The rates deliberately pay for behaviour that lowers Litchi's risk, not for
 * behaviour a borrower would do anyway. Paying on time is the floor; paying
 * ahead, keeping a moving buffer and bringing in another renter are the things
 * actually worth money.
 */
export const POINTS = {
  /** Per repayment made on time. 40 x 52 = 2,080 a year, about $42 of value. */
  perOnTimePayment: 40,
  /** Per $50 paid ahead of schedule. Early repayment is less exposure. */
  perFiftyPaidEarly: 25,
  /** Per weekly Moving Fund top-up. A buffer is what stops the next default. */
  perFundTopUp: 10,
  /** One-off, for verifying identity, income and tenancy. */
  profileComplete: 400,
  /** Per referred renter who takes a bond. */
  perReferral: 500,
} as const;

const fundTopUpsMade = FUND_TOP_UP_DATES.length;

export const rewardCategories: RewardCategory[] = [
  {
    key: "on-time",
    label: "On-time payments",
    earned: weeklyPaymentsMade * POINTS.perOnTimePayment,
    description: `${POINTS.perOnTimePayment} points for every repayment made on time.`,
  },
  {
    key: "fund",
    label: "Moving Fund streak",
    earned: fundTopUpsMade * POINTS.perFundTopUp,
    description: `${POINTS.perFundTopUp} points each week you top up your Moving Fund.`,
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
    earned: POINTS.profileComplete,
    description: "One-off bonus for verifying your identity, income and tenancy details.",
  },
];

/**
 * Tiers run on points *earned over the lifetime of the account*, never on the
 * spendable balance. Deriving status from the balance means redeeming a reward
 * demotes you, which punishes the exact behaviour the programme exists to
 * encourage.
 *
 * The thresholds are set against what a single 52-week tenancy can actually
 * produce — roughly 2,900 points before any extra payments — so Orchard is
 * reached late in a first tenancy rather than never.
 */
export interface RewardTier {
  key: string;
  name: string;
  /** Lifetime points needed to reach it. */
  at: number;
  benefits: string[];
}

export const rewardTiers: RewardTier[] = [
  {
    key: "sprout",
    name: "Sprout",
    at: 0,
    benefits: ["Earn points on every on-time repayment", "Repayment credits available"],
  },
  {
    key: "grove",
    name: "Grove",
    at: 1000,
    benefits: [
      "Everything in Sprout",
      "Moving Fund top-ups unlocked",
      "Rental record certificate unlocked",
    ],
  },
  {
    key: "orchard",
    name: "Orchard",
    at: 2500,
    benefits: [
      "Everything in Grove",
      "Partner offers unlocked",
      "Priority support — a person, not a queue",
    ],
  },
];

export const rewards = {
  /** Always the sum of the categories above — never a number of its own. */
  basePoints: rewardCategories.reduce((sum, category) => sum + category.earned, 0),
  /** Three on-time payments so far in September, plus that month's top-ups. */
  earnedThisMonth: 3 * POINTS.perOnTimePayment + 3 * POINTS.perFundTopUp,
};

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Lowest tier that can redeem it. */
  tier: string;
  /** What it is worth in dollars, where that is a meaningful question. */
  worth?: number;
}

/*
 * Priced at roughly 2c a point, improving to 2.5c at the top so the ladder is
 * worth climbing. Every item is reachable inside one 52-week tenancy, which
 * the previous catalogue was not: the end-of-tenancy clean cost 3,500 points
 * and the payment pause 5,000, against a lifetime ceiling of about 2,900.
 *
 * The clean is a partner discount rather than the whole job. Giving away a
 * $250 service on a $2,800 interest-free loan is roughly nine percent of
 * principal, which no lender on this margin can fund.
 *
 * The old "one-week payment pause" is gone on purpose. Letting someone defer a
 * week when money is tight is a hardship provision, and hardship provisions
 * should not be sold for points to the people least able to have saved them.
 * It is offered to anyone who asks instead.
 */
export const rewardCatalogue: Reward[] = [
  {
    id: "rw_repayment_credit",
    name: "$10 repayment credit",
    description: "Comes off your next weekly Litchi payment.",
    cost: 500,
    tier: "sprout",
    worth: 10,
  },
  {
    id: "rw_moving_fund",
    name: "$25 Moving Fund top-up",
    description: "Straight into your Moving Fund balance.",
    cost: 1100,
    tier: "grove",
    worth: 25,
  },
  {
    id: "rw_rental_record",
    name: "Rental record certificate",
    description:
      "A signed summary of your payment history to hand to your next landlord. Yours to keep.",
    cost: 1500,
    tier: "grove",
  },
  {
    id: "rw_end_clean",
    name: "$40 off an end-of-tenancy clean",
    description: "With our cleaning partner, booked for your final week.",
    cost: 1600,
    tier: "orchard",
    worth: 40,
  },
  {
    id: "rw_final_payments",
    name: "$50 off your final payments",
    description: "Knocked off the last weeks of your plan.",
    cost: 2000,
    tier: "orchard",
    worth: 50,
  },
];

export const movingFund = {
  autoTopUp: 20,
  /*
   * Reachable inside the tenancy it exists to fund. At $20 a week from $680, a
   * $2,500 goal is 91 weeks away — the plan runs 52, so the old target could
   * never be met before the move it was saving for.
   *
   * $1,500 is the right number rather than just a smaller one: Litchi finances
   * the next bond, so this fund is not for the bond. It is for everything else
   * a move costs — movers, letting costs, rent in advance, a final clean.
   */
  goal: 1500,
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
