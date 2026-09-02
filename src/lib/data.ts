/**
 * Sample data for the Litchi prototype.
 *
 * Litchi's first product is *bond financing*: a lending partner pays the
 * tenant's bond up front, the statutory bond is lodged with Tenancy Services,
 * and the tenant repays Litchi a fixed amount each week. Rent is a separate
 * payment to the landlord and is never described as a Litchi repayment.
 */

/** The prototype runs against a fixed "today" so sample data stays coherent. */
export const TODAY = "2026-09-02";

export const renter = {
  firstName: "Malcolm",
  lastName: "Moffett",
  displayName: "Malcolm M.",
  role: "Renter",
  initials: "MM",
  memberSince: "2026-07-14",
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
 * The financed side of the bond. `baseRepaid` is what has been paid so far in
 * the sample history; anything the user adds in-session is layered on top by
 * the store.
 */
export const plan = {
  principal: 2800,
  weeklyPayment: 53.85,
  baseRepaid: 532.7,
  termWeeks: 52,
  /** Contractual end of the finance term — repayment is projected to land on or before this. */
  agreedEndDate: "2027-07-14",
  nextPaymentDate: "2026-09-04",
  startDate: "2026-07-17",
  establishmentFee: 0,
  interestRate: 0,
  partner: "Kōwhai Finance Ltd",
  agreementRef: "LB-2026-284731",
} as const;

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
    detail: "9 of 9 Litchi payments made on time.",
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

export const rewardCategories: RewardCategory[] = [
  {
    key: "on-time",
    label: "On-time payments",
    earned: 720,
    description: "80 points for every repayment made on time.",
  },
  {
    key: "history",
    label: "Consistent renter history",
    earned: 370,
    description: "Earned as your verified tenancy record grows.",
  },
  {
    key: "profile",
    label: "Completed profile",
    earned: 150,
    description: "One-off bonus for verifying your details.",
  },
];

export const rewards = {
  basePoints: 1240,
  earnedThisMonth: 120,
  tier: "Grove",
  nextTier: "Orchard",
  nextTierAt: 1500,
} as const;

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

export const movingFund = {
  baseSaved: 680,
  goal: 2500,
  autoTopUp: 20,
  openedDate: "2026-07-21",
} as const;

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

/**
 * Repayments to date. Eight weekly payments plus one extra payment the renter
 * made in August — together exactly the $532.70 shown on the dashboard.
 */
export const repaymentHistory: { date: string; amount: number; kind: "repayment" | "extra" }[] = [
  { date: "2026-07-17", amount: 53.85, kind: "repayment" },
  { date: "2026-07-24", amount: 53.85, kind: "repayment" },
  { date: "2026-07-31", amount: 53.85, kind: "repayment" },
  { date: "2026-08-04", amount: 101.9, kind: "extra" },
  { date: "2026-08-07", amount: 53.85, kind: "repayment" },
  { date: "2026-08-14", amount: 53.85, kind: "repayment" },
  { date: "2026-08-21", amount: 53.85, kind: "repayment" },
  { date: "2026-08-28", amount: 53.85, kind: "repayment" },
  { date: "2026-09-02", amount: 53.85, kind: "repayment" },
];

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
    id: "act_reward_aug",
    date: "2026-08-31",
    kind: "reward",
    title: "Litchi Rewards earned",
    detail: "On-time payments — August",
    points: 120,
  },
  {
    id: "act_fund_aug",
    date: "2026-08-21",
    kind: "fund",
    title: "Moving Fund top-up",
    detail: "Automatic weekly top-up",
    amount: 20,
  },
  {
    id: "act_fund_aug_2",
    date: "2026-08-07",
    kind: "fund",
    title: "Moving Fund top-up",
    detail: "Automatic weekly top-up",
    amount: 20,
  },
  {
    id: "act_bond_lodged",
    date: "2026-07-14",
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
