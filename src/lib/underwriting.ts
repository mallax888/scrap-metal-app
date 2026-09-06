import { bond as bondRules, plan } from "./data";

/**
 * Whether Litchi will finance a bond, and why.
 *
 * Kept apart from the UI because it is the part a lending partner will actually
 * interrogate. Every check below is stated as a rule with a number attached, so
 * the answer to "how do you decide" is something you can point at rather than
 * describe.
 *
 * The tests are affordability tests, not credit-history tests. Litchi's
 * customer is someone who can pay a bond weekly but not in one lump — which is
 * most renters — so screening on a thin credit file would decline exactly the
 * people the product exists for. What matters is whether the repayment fits
 * alongside the rent, and whether the income behind it is steady.
 */
export type Employment = "permanent" | "fixed-term" | "casual" | "self-employed" | "benefit";

export const EMPLOYMENT_LABELS: Record<Employment, string> = {
  permanent: "Permanent employee",
  "fixed-term": "Fixed-term contract",
  casual: "Casual or seasonal",
  "self-employed": "Self-employed",
  benefit: "Benefit or superannuation",
};

export interface Application {
  /** Rent for the property being applied for. */
  weeklyRent: number;
  /** Take-home pay, after tax, across everyone who will be named on the plan. */
  weeklyIncome: number;
  employment: Employment;
  monthsInRole: number;
}

export interface Check {
  key: string;
  label: string;
  detail: string;
  /** "pass" clears it, "refer" sends it to a human, "fail" declines it. */
  result: "pass" | "refer" | "fail";
}

export type Outcome = "approved" | "refer" | "declined";

export interface Assessment {
  bond: number;
  fee: number;
  totalRepayable: number;
  weeklyPayment: number;
  termWeeks: number;
  /** Rent plus the Litchi repayment, as a share of take-home pay. */
  housingShare: number;
  /** What is left each week once rent and the repayment are paid. */
  weeklyLeftOver: number;
  outcome: Outcome;
  checks: Check[];
}

/* Thresholds, named so the numbers are arguable rather than buried. */
export const RULES = {
  /*
   * Above this share of take-home pay on housing, Litchi will not lend. Set at
   * 60% rather than the 30% that defines "housing stress", because a rule at
   * 30% would decline most renters in Auckland and Wellington — including
   * every one of them who is paying their rent perfectly well. The question is
   * not whether their rent is too high; it is whether another $57 a week on
   * top of it is survivable.
   */
  housingShareMax: 0.6,
  /** Above this, a person looks at it before it goes ahead. */
  housingShareRefer: 0.5,
  /** The repayment should be a small part of what is left after rent. */
  repaymentShareOfRemainderMax: 0.35,
  /** Below this, income is too new to lean on without a look. */
  monthsInRoleRefer: 3,
  /** Casual work is fine, it just needs a longer track record. */
  casualMonthsInRoleRefer: 6,
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The weekly repayment for a given bond: bond plus the flat fee, spread over
 * the term. Rounded up to the cent so the schedule can never end up a cent
 * short of settling.
 */
export function quoteWeekly(bondAmount: number): number {
  const total = bondAmount * (1 + plan.feeRate);
  return Math.ceil((total / plan.termWeeks) * 100) / 100;
}

export function assess(application: Application): Assessment {
  const { weeklyRent, weeklyIncome, employment, monthsInRole } = application;

  // The bond is capped at four weeks' rent by the Residential Tenancies Act,
  // so the amount to finance is a consequence of the rent, never a choice.
  const bondAmount = round2(weeklyRent * bondRules.weeksOfRent);
  const fee = round2(bondAmount * plan.feeRate);
  const totalRepayable = round2(bondAmount + fee);
  const weeklyPayment = quoteWeekly(bondAmount);

  const housingShare = weeklyIncome > 0 ? (weeklyRent + weeklyPayment) / weeklyIncome : 1;
  const afterRent = weeklyIncome - weeklyRent;
  const weeklyLeftOver = round2(afterRent - weeklyPayment);
  const repaymentShareOfRemainder = afterRent > 0 ? weeklyPayment / afterRent : 1;

  const checks: Check[] = [
    {
      key: "affordability",
      label: "Rent and repayment against income",
      detail: `${Math.round(housingShare * 100)}% of take-home pay goes on rent plus the repayment.`,
      result:
        housingShare > RULES.housingShareMax
          ? "fail"
          : housingShare > RULES.housingShareRefer
            ? "refer"
            : "pass",
    },
    {
      key: "headroom",
      label: "What's left after rent",
      detail:
        afterRent <= 0
          ? "Rent already takes the whole income."
          : `The repayment is ${Math.round(repaymentShareOfRemainder * 100)}% of what's left once rent is paid.`,
      result:
        afterRent <= 0 || repaymentShareOfRemainder > RULES.repaymentShareOfRemainderMax
          ? "fail"
          : "pass",
    },
    {
      key: "stability",
      label: "Income stability",
      detail: `${EMPLOYMENT_LABELS[employment]}, ${monthsInRole} month${
        monthsInRole === 1 ? "" : "s"
      } in the role.`,
      result:
        monthsInRole < RULES.monthsInRoleRefer ||
        (employment === "casual" && monthsInRole < RULES.casualMonthsInRoleRefer)
          ? "refer"
          : "pass",
    },
    {
      key: "bond-cap",
      label: "Bond within the legal cap",
      detail: `${bondRules.weeksOfRent} weeks' rent is the maximum a landlord can take.`,
      result: "pass",
    },
  ];

  const outcome: Outcome = checks.some((c) => c.result === "fail")
    ? "declined"
    : checks.some((c) => c.result === "refer")
      ? "refer"
      : "approved";

  return {
    bond: bondAmount,
    fee,
    totalRepayable,
    weeklyPayment,
    termWeeks: plan.termWeeks,
    housingShare,
    weeklyLeftOver,
    outcome,
    checks,
  };
}
