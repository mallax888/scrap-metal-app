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
  /** A twelve-month fixed term, which is the usual first tenancy. */
  fixedTermMonths: 12,
  endDate: "2027-07-14",
  landlordAgency: "Example Property Co.",
  rentWeekly: 700,
  rentDay: "Friday",
  /** Notice a tenant must give to end a periodic tenancy. */
  noticeDays: 28,
} as const;

export const bond = {
  amount: 2800,
  bondId: "NZB-284731",
  lodgedWith: "Tenancy Services",
  /**
   * When the lender paid the agent, which is deliberately not move-in day.
   * The bond clearing a week ahead is the point of the product: it is the
   * agent's condition of handing over keys, so leaving it to the morning of
   * the move puts the tenant back in exactly the scramble Litchi exists to
   * remove.
   */
  paidDate: "2026-07-06",
  /** When the agent lodged it. A separate event, days later. */
  lodgedDate: "2026-07-14",
  /**
   * Days between the bond clearing and the tenant getting the keys.
   *
   * Not a statutory period — there isn't one. In practice the bond and up to
   * two weeks' rent in advance are paid when the tenancy agreement is signed,
   * sit in the agency's trust account until the possession date, and are a
   * condition of the keys being handed over. That gap is what "securing the
   * place" actually consists of, and it is the week Litchi is buying back for
   * a tenant who does not have four weeks' rent lying around.
   */
  typicalDaysBeforeMoveIn: 8,
  status: "Lodged with Tenancy Services",
  weeksOfRent: 4,
} as const;

/**
 * The financed side of the bond.
 *
 * Two amounts, and the app must never let them blur into one. `principal` is
 * the bond itself — what the lending partner pays the agent and what Tenancy
 * Services holds. `totalRepayable` is what the renter actually pays back: the
 * bond plus Litchi's fee. Anything showing "the bond" means the first;
 * anything showing progress, balance or a schedule means the second.
 *
 * The fee is Litchi's whole revenue model: a flat 5% of the bond, quoted up
 * front and spread evenly across the instalments. Not interest, so it does not
 * grow with time and paying early does not reduce it — it is a fixed price for
 * the service, which is why the repayment is the same figure every week.
 *
 * 52 payments of $56.54 with the last trimmed to $56.46 settles the balance at
 * exactly $2,940.
 */
const BOND_AMOUNT = 2800;
const FEE_RATE = 0.05;

export const plan = {
  /** The bond. Paid to the agent, lodged with Tenancy Services. */
  principal: BOND_AMOUNT,
  /** Litchi's only charge. */
  feeRate: FEE_RATE,
  fee: Math.round(BOND_AMOUNT * FEE_RATE * 100) / 100,
  /** Bond + fee. What the schedule repays and what progress is measured against. */
  totalRepayable: Math.round(BOND_AMOUNT * (1 + FEE_RATE) * 100) / 100,
  weeklyPayment: 56.54,
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

/**
 * Everything a move actually involves.
 *
 * Deliberately unpriced. The point is the length of the list and the fact that
 * it all falls due in the same week — put figures on it and the conversation
 * becomes an argument about whether the movers really cost that, which is not
 * the argument worth having here.
 */
export interface MovingTask {
  label: string;
  detail: string;
  /** The one line Litchi pays outright. */
  covered?: boolean;
  /** Litchi does not pay for it, but it can be booked and spread. */
  bookable?: boolean;
}

export const movingChecklist: MovingTask[] = [
  {
    label: "The bond",
    // Paid before the keys, lodged afterwards — the landlord has 23 working
    // days from receiving it, so lodgement almost always lands after move-in.
    detail: `${bond.weeksOfRent} weeks' rent, paid to your agent before you get the keys`,
    covered: true,
  },
  {
    label: "Rent in advance",
    detail: "Up to two weeks of it, paid before you get the keys",
  },
  {
    label: "Movers",
    detail: "A truck and a couple of people, booked for the day",
    bookable: true,
  },
  {
    label: "A professional clean",
    detail: "Of the place you're leaving, or you can lose part of your old bond",
    bookable: true,
  },
  {
    label: "Power and internet",
    detail: "Disconnected at one address and connected at the other",
  },
  {
    // Not a letting fee: charging a tenant one has been unlawful since
    // 12 December 2018. A pet bond is the genuine extra, and it is new —
    // the pet-friendly tenancy rules only started on 1 December 2025.
    label: "A pet bond, if a pet is coming",
    detail: "Up to another two weeks' rent, on top of the bond itself",
  },
];

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
 * Ten payments x $56.54 is the $565.40 (19%) shown on the dashboard.
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
export const weeklyPaymentsMade = repaymentHistory.filter((entry) => entry.kind === "repayment").length;

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
 * Litchi's own renter score.
 *
 * These are the factors for a clean record — the baseline the score starts
 * from. What actually moves them lives in the store, because the score has to
 * answer to what the renter has done rather than sit at a flattering number
 * while the dashboard says a payment failed.
 *
 * Weights are chosen so a clean record rounds to 94. Deliberately not a credit
 * score, and never reported anywhere.
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
    /*
     * Not "no missed or rescheduled payments". Moving a payment before it is
     * due is free and explicitly does not touch the score — saying otherwise
     * here contradicted the promise made everywhere else, and would have
     * quietly discouraged the one behaviour the product most wants.
     */
    detail: "No missed payments since you joined. Moving one never counts against you.",
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

/**
 * What a missed payment costs, and what paying ahead earns.
 *
 * Sized to be felt without being punitive: one missed payment takes the score
 * from 94 to 87 — enough that it clearly matters, not so much that someone
 * who had a bad week concludes the damage is done and stops trying. A product
 * that pays for hardship support and then wrecks the score anyway is only
 * pretending to be humane.
 */
export const SCORE_EFFECTS = {
  missedPaymentHistory: -12,
  missedConsistency: -15,
  /** Per voluntary extra payment. Catching up a missed one does not count. */
  extraPaymentHistory: 1,
} as const;

export interface ScoreBand {
  at: number;
  label: string;
}

/** Highest first — the first one the score reaches is the band. */
export const SCORE_BANDS: ScoreBand[] = [
  { at: 90, label: "Excellent" },
  { at: 75, label: "Strong" },
  { at: 60, label: "Building" },
  { at: 0, label: "Needs work" },
];

export function scoreBand(value: number): string {
  return (SCORE_BANDS.find((b) => value >= b.at) ?? SCORE_BANDS[SCORE_BANDS.length - 1]).label;
}

export const renterScore = {
  value: Math.round(scoreFactors.reduce((sum, f) => sum + f.value * f.weight, 0)),
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

/* ------------------------------------------------------------------ *
 * Round-ups.
 *
 * Every card purchase rounds up and the difference lands in the Moving
 * Fund. The mechanic is Feijoa's; what Litchi adds is a deadline — it
 * already knows what the next move costs and the day the fixed term ends,
 * so the question is never "how much have I saved" but "will it be there
 * in time".
 *
 * The three rules below are product, not small print. Round-ups come out
 * of accounts that are sometimes nearly empty, belonging to people who
 * also owe us money, which makes every one of them a way to do harm:
 *   - balanceFloor: skip rather than overdraw. An overdraft fee would
 *     dwarf a week of round-ups.
 *   - weeklyCap: a habit nobody notices must still have a ceiling.
 *   - arrears: they stand down entirely while a payment has failed.
 *     Sweeping change out of someone who is behind with us is
 *     indefensible, whatever the balance says afterwards.
 * ------------------------------------------------------------------ */

export interface Purchase {
  merchant: string;
  /** Day of the week it landed, for the "this week" list. */
  day: string;
  amount: number;
}

/**
 * A week of one renter's card spending, used to work out what each rounding
 * setting would actually collect. Derived rather than asserted: the figure on
 * the screen is the sum of these, so changing the setting changes the estimate
 * the same way it would change a real week.
 */
export const weeklyPurchases: Purchase[] = [
  { merchant: "Flat white, Daily Bread", day: "Mon", amount: 5.5 },
  { merchant: "AT HOP top-up", day: "Mon", amount: 20 },
  { merchant: "Countdown, Mt Eden", day: "Tue", amount: 23.6 },
  { merchant: "Z Petrol", day: "Tue", amount: 61.15 },
  { merchant: "Chemist Warehouse", day: "Wed", amount: 12.4 },
  { merchant: "Uber Eats", day: "Wed", amount: 34.9 },
  { merchant: "Countdown, Mt Eden", day: "Thu", amount: 18.75 },
  { merchant: "Kmart", day: "Thu", amount: 29 },
  { merchant: "Spotify", day: "Fri", amount: 14.99 },
  { merchant: "The Coffee Club", day: "Fri", amount: 4.8 },
  { merchant: "Night 'n Day", day: "Sat", amount: 7.25 },
  { merchant: "BP Connect", day: "Sun", amount: 45.3 },
];

/** Weeks already collected, which is why the balance is above the top-ups. */
const ROUND_UP_WEEKS = [
  { date: "2026-08-28", amount: 9.85 },
  { date: "2026-09-04", amount: 12.3 },
  { date: "2026-09-11", amount: 10.6 },
];

export const roundUps = {
  /** What the tenant can round to. Feijoa offers the same three. */
  options: [1, 2, 5] as const,
  /** Where the purchases are read from, and by whom. */
  account: {
    bank: "ANZ",
    last4: "2241",
    via: "Akahu",
    connectedDate: "2026-09-03",
  },
  /** Never take a round-up that leaves the account under this. */
  balanceFloor: 50,
  /** However much someone spends, this is the most a week can collect. */
  weeklyCap: 25,
  /** Skipped by the floor in the week shown, so the rule is visible working. */
  skippedThisWeek: 2,
  skippedDay: "Thursday",
  weeks: ROUND_UP_WEEKS,
  collected: ROUND_UP_WEEKS.reduce((sum, week) => sum + week.amount, 0),
} as const;

export const movingFund = {
  autoTopUp: 20,
  /*
   * The honest number rather than the achievable one.
   *
   * It was $1,500, which was a compromise: at $20 a week the real figure was
   * out of reach inside the tenancy it exists to fund, so the target was cut
   * to fit the contribution. Round-ups change that arithmetic, so the goal can
   * go back to what a move actually leaves you to find.
   *
   * A move on this tenancy costs about $5,300. Litchi finances the $2,800
   * bond, so this fund is for the other $2,500 — rent in advance, the movers,
   * the clean on the way out. It is not for the bond.
   */
  goal: 2500,
  openedDate: "2026-07-21",
  get baseSaved() {
    return (
      FUND_OPENING_DEPOSIT +
      FUND_TOP_UP_DATES.length * this.autoTopUp +
      roundUps.collected
    );
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
  ...roundUps.weeks.map((week, index) => ({
    id: `act_roundup_${index}`,
    date: week.date,
    kind: "fund" as const,
    title: "Round-ups",
    detail: `From ${roundUps.account.bank} •••• ${roundUps.account.last4}`,
    amount: week.amount,
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
    id: "eco_insurance",
    name: "Contents insurance",
    blurb: "Cover priced for renters, not homeowners.",
    status: "soon",
  },
  {
    id: "eco_moving",
    name: "Cleaners & movers",
    blurb: "A vetted bond clean and a truck, booked through Litchi.",
    status: "live",
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
    a: "Tenancy Services refunds it to your own account once you and your landlord both request it. Litchi has no claim on that refund and never takes repayments out of it. If you still owe us anything, the plan simply carries on at the same weekly amount — or you can use the refund to clear it in one go.",
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

/* ------------------------------------------------------------------ *
 * The other side of the product.
 *
 * Litchi reaches renters through property managers, so the agency has a
 * view of its own — and what it does *not* contain is the point. An agent
 * sees that the bond was paid and lodged, because that is their job. They
 * do not see the repayment schedule, the balance, a missed payment or the
 * Litchi Score, because that is the tenant's business and no part of the
 * tenancy.
 * ------------------------------------------------------------------ */

export const agency = {
  name: "Example Property Co.",
  manager: "Priya Raman",
  managerRole: "Senior Property Manager",
  initials: "PR",
  /** Roughly a mid-sized Auckland agency's book. */
  propertiesManaged: 218,
} as const;

/**
 * Where a tenancy has got to, from the agency's point of view. Deliberately
 * about the bond and nothing else — there is no "behind on payments" status
 * here because an agent has no business being told that.
 */
export type BondStage = "lodged" | "paid" | "approved" | "applying";

export interface AgentTenancy {
  id: string;
  property: string;
  suburb: string;
  tenant: string;
  weeklyRent: number;
  bond: number;
  stage: BondStage;
  /** When the lending partner paid the agency. Null until it is approved. */
  paidDate: string | null;
  /** Tenancy Services reference, once lodged. */
  bondId: string | null;
  moveIn: string;
}

export const agentTenancies: AgentTenancy[] = [
  {
    // The tenancy the rest of this app belongs to, seen from the other side.
    id: "AT-01",
    property: "12 Example Street",
    suburb: "Mount Eden",
    tenant: "Malcolm Moffett",
    weeklyRent: 700,
    bond: 2800,
    stage: "lodged",
    paidDate: "2026-07-06",
    bondId: "NZB-284731",
    moveIn: "2026-07-14",
  },
  {
    id: "AT-02",
    property: "5/218 Sandringham Road",
    suburb: "Sandringham",
    tenant: "Tere Ngata",
    weeklyRent: 620,
    bond: 2480,
    stage: "lodged",
    paidDate: "2026-08-14",
    bondId: "NZB-291044",
    moveIn: "2026-08-22",
  },
  {
    id: "AT-03",
    property: "41B Onslow Avenue",
    suburb: "Epsom",
    tenant: "Danielle Cooper",
    weeklyRent: 815,
    bond: 3260,
    stage: "paid",
    paidDate: "2026-09-11",
    bondId: null,
    moveIn: "2026-09-19",
  },
  {
    id: "AT-04",
    property: "Unit 9, 33 Rialto Street",
    suburb: "New Lynn",
    tenant: "Sam Iosefa",
    weeklyRent: 560,
    bond: 2240,
    stage: "approved",
    paidDate: null,
    bondId: null,
    moveIn: "2026-09-26",
  },
  {
    id: "AT-05",
    property: "7 Kereru Lane",
    suburb: "Massey",
    tenant: "Aroha Wilson",
    weeklyRent: 700,
    bond: 2800,
    stage: "applying",
    paidDate: null,
    bondId: null,
    moveIn: "2026-10-03",
  },
];

/**
 * What an agency can and cannot see about a tenant Litchi has financed.
 *
 * Written as two lists rather than a paragraph because the boundary is the
 * thing a property manager will ask about first, and a paragraph lets you
 * skate over the second half.
 */
export const agentVisibility = {
  can: [
    "That the bond was paid, in full, and on what date",
    "The amount, and the Tenancy Services bond reference once it is lodged",
    "Whether an application is still in progress before move-in",
    "A receipt for your file and your trust accounting",
  ],
  cannot: [
    "The repayment schedule, or how much is left to repay",
    "Whether a payment has been missed, moved or paid early",
    "The tenant's Litchi Score, or anything behind it",
    "Whether the tenant has asked us for hardship help",
  ],
} as const;

/* ------------------------------------------------------------------ *
 * The two jobs either side of a bond.
 *
 * The bond is the money; the clean and the truck are the work. They belong
 * in the same product because the exit clean is what decides whether the
 * bond comes back whole — cleaning is one of the most common reasons a
 * landlord claims against it. Litchi paying the bond in and then helping
 * get it back out is one story, not two.
 *
 * Deliberately a shortlist rather than a marketplace. Recommend a bad
 * cleaner and the tenant loses bond money and blames Litchi, so a handful
 * of vetted operators who get real volume beats a directory of everyone.
 * ------------------------------------------------------------------ */

export const PROPERTY_SIZES = [
  { value: "small", label: "1–2 bedrooms" },
  { value: "medium", label: "3 bedrooms" },
  { value: "large", label: "4+ bedrooms" },
] as const;

export type PropertySize = (typeof PROPERTY_SIZES)[number]["value"];

export interface MoveService {
  id: string;
  name: string;
  /** What it is for, in the tenant's terms. */
  blurb: string;
  provider: string;
  /** How long the vetted operator has been on the shortlist. */
  providerNote: string;
  includes: string[];
  prices: Record<PropertySize, number>;
}

export const moveServices: MoveService[] = [
  {
    id: "bond-clean",
    name: "Bond clean",
    blurb:
      "The end-of-tenancy clean your agent inspects against. Cleaning is one of the most common things landlords claim a bond for, so this is the job that decides how much of yours comes back.",
    provider: "Kōrero Clean",
    providerNote: "On the shortlist since 2025. 340 bond cleans, 6 re-dos.",
    includes: [
      "Oven, rangehood and inside all cupboards",
      "Carpets steam cleaned, including under furniture",
      "Windows, tracks, sills and blinds",
      "Bathrooms descaled, walls spot-washed",
    ],
    prices: { small: 320, medium: 450, large: 620 },
  },
  {
    id: "removals",
    name: "Removals",
    blurb:
      "A truck and two people for the day, insured for the load. Booked for your possession date rather than whenever a slot happens to be free.",
    provider: "Tui Movers",
    providerNote: "On the shortlist since 2024. 1,100 moves, 4.8 average.",
    includes: [
      "Truck, two movers, blankets and straps",
      "Up to four hours, then charged by the half hour",
      "Goods in transit cover included",
      "Boxes dropped off a week before, free",
    ],
    prices: { small: 420, medium: 650, large: 890 },
  },
];

/**
 * What the provider pays Litchi for the booking.
 *
 * Disclosed in the app rather than buried, because a renter who finds out
 * later that the "recommendation" was paid for has been sold something, and
 * the whole product depends on them not feeling that.
 */
export const SERVICE_COMMISSION_RATE = 0.15;

/** Services are a smaller advance than a bond, so they run over half the term. */
export const SERVICE_TERM_WEEKS = 26;

/* ------------------------------------------------------------------ *
 * The move itself.
 *
 * The record at the centre of the app. Not the loan — the move. A tenancy
 * that an agency confirmed, a set of costs that were actually incurred, and
 * who ended up paying each one.
 *
 * Only part of it was financed, and that is the point. Litchi covered the
 * bond because that is the line nobody has in cash; the rent in advance and
 * the exit clean were paid outright, and the truck was booked through Litchi
 * but paid straight to the mover. A screen that showed only the financed
 * line would be a loan statement, and would leave out three-quarters of what
 * the person actually did.
 * ------------------------------------------------------------------ */

/** How a given cost was handled. Mirrors the Coverage union in lib/move. */
export type MoveCoverage = "self" | "book" | "litchi";

export interface CompletedMoveLine {
  id: string;
  label: string;
  amount: number;
  coverage: MoveCoverage;
  /** Who the money went to. */
  paidTo: string;
  /** When it was settled. */
  date: string;
  note?: string;
}

export const myMove = {
  /** The tenancy this move was into. */
  property: tenancy.property,
  suburb: tenancy.suburb,
  movedIn: tenancy.startDate,
  agencyName: tenancy.landlordAgency,
  /** The verification that made the application quick — and the lender comfortable. */
  verifiedBy: "Priya Raman",
  verifiedOn: "2026-07-03",
  verifiedFields: ["Weekly rent", "Bond", "Tenancy start date", "Property address"],
  lines: [
    {
      id: "bond",
      label: "Bond",
      amount: 2800,
      coverage: "litchi",
      paidTo: tenancy.landlordAgency,
      date: "2026-07-06",
      note: "Paid direct to the agency's trust account, eight days before you got the keys.",
    },
    {
      id: "rent-advance",
      label: "Rent in advance",
      amount: 1400,
      coverage: "self",
      paidTo: tenancy.landlordAgency,
      date: "2026-07-06",
      note: "Two weeks, which is the most a landlord can require.",
    },
    {
      id: "removals",
      label: "Movers",
      amount: 650,
      coverage: "book",
      paidTo: "Tui Movers",
      date: "2026-07-14",
      note: "Booked through Litchi, paid straight to them on the day.",
    },
    {
      id: "bond-clean",
      label: "Bond clean",
      amount: 450,
      coverage: "self",
      paidTo: "Kōrero Clean",
      date: "2026-07-11",
      note: "Of the flat you left. Your old bond came back whole.",
    },
  ] as CompletedMoveLine[],
} as const;
