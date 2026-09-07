import { bond as bondRules, plan } from "./data";
import { addDays, toDate } from "./format";
import { quoteWeekly } from "./underwriting";

/**
 * What happens between "approved" and a working account.
 *
 * The app had a decision at one end and a running tenancy at the other, and
 * nothing in between — no moment where anyone commits to anything or any money
 * actually moves. That gap is the first thing a lender asks about, and it is
 * where most of the obligations live: identity verification under the AML/CFT
 * Act, an affordability assessment based on something better than the
 * applicant's own estimate, disclosure of the key terms *before* the contract
 * is entered, and an authority to debit the account.
 *
 * The structure this models is deliberate. Litchi is the servicer, not the
 * lender: the money comes from the lending partner, the direct debit authority
 * is in the partner's favour, and Litchi never holds the customer's money. It
 * keeps the client-funds obligations with the party already carrying them, and
 * it is the same story the agency page tells.
 */

/** Weekend payments do not clear, so the schedule has to know about them. */
export function nextBusinessDay(iso: string): string {
  let date = iso;
  for (let i = 0; i < 7; i++) {
    const day = toDate(date).getUTCDay();
    if (day !== 0 && day !== 6) return date;
    date = addDays(date, 1);
  }
  return date;
}

export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
] as const;

export type PaymentDay = (typeof WEEKDAYS)[number]["value"];

/** The first occurrence of a weekday on or after a date. */
export function firstPaymentDate(fromISO: string, weekday: PaymentDay): string {
  let date = fromISO;
  for (let i = 0; i < 7; i++) {
    if (toDate(date).getUTCDay() === weekday) return date;
    date = addDays(date, 1);
  }
  return date;
}

/**
 * A New Zealand bank account number: bank, branch, account, suffix.
 *
 * Checked because a direct debit set up against a mistyped account fails
 * silently a week later, by which time it looks like a missed payment — and
 * this product has spent a lot of effort on not punishing people for those.
 */
export function parseAccountNumber(input: string): { ok: boolean; formatted: string; reason?: string } {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return { ok: false, formatted: "", reason: "Enter your account number." };
  if (digits.length < 15 || digits.length > 16) {
    return {
      ok: false,
      formatted: input,
      reason: "A New Zealand account number has 15 or 16 digits — bank, branch, account, suffix.",
    };
  }
  const bank = digits.slice(0, 2);
  const branch = digits.slice(2, 6);
  const account = digits.slice(6, 13);
  const suffix = digits.slice(13);
  return { ok: true, formatted: `${bank}-${branch}-${account}-${suffix}` };
}

/** Everything the money-movement timeline needs, worked out from one date. */
export interface Timeline {
  signed: string;
  bondPaid: string;
  lodgedBy: string;
  firstPayment: string;
  lastPayment: string;
  cancelUntil: string;
}

export function buildTimeline(todayISO: string, weekday: PaymentDay, termWeeks: number): Timeline {
  // Payments settle in business-day batches, so "before move-in" means
  // initiating ahead of it rather than on the morning.
  const bondPaid = nextBusinessDay(addDays(todayISO, 1));
  const firstPayment = firstPaymentDate(addDays(bondPaid, 7), weekday);
  return {
    signed: todayISO,
    bondPaid,
    // The Residential Tenancies Act gives the landlord 23 working days to lodge.
    lodgedBy: addDays(bondPaid, 31),
    firstPayment,
    lastPayment: addDays(firstPayment, (termWeeks - 1) * 7),
    cancelUntil: nextBusinessDay(addDays(todayISO, 7)),
  };
}

/** The numbers for a given rent, so the setup flow quotes what /apply quoted. */
export function quoteFor(weeklyRent: number) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const bondAmount = round2(weeklyRent * bondRules.weeksOfRent);
  const fee = round2(bondAmount * plan.feeRate);
  const weekly = quoteWeekly(bondAmount);
  const total = round2(bondAmount + fee);
  // The last payment absorbs the rounding so the schedule settles exactly.
  const last = round2(total - weekly * (plan.termWeeks - 1));
  return { bondAmount, fee, total, weekly, last, termWeeks: plan.termWeeks };
}
