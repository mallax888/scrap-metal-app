/**
 * Round-ups, and the only question worth asking about them.
 *
 * Saving a few cents a day is invisible by design — which is the point and
 * the danger. Nobody feels $0.40, so nobody notices ten months later that the
 * habit was never going to reach the number. So the arithmetic here is not
 * "how much have I put away", it is "given this setting, will the money be
 * there on the day I move", and the answer is allowed to be no.
 */

import { TODAY, movingFund, roundUps, tenancy, type Purchase } from "./data";
import { addWeeks, daysBetween } from "./format";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What one purchase contributes at a given rounding. */
export function roundUpFor(amount: number, rounding: number): number {
  // The epsilon keeps an amount already on the boundary — a $20.00 top-up at
  // $5 rounding — contributing nothing rather than a whole extra unit.
  const target = Math.ceil(amount / rounding - 1e-9) * rounding;
  return round2(target - amount);
}

/**
 * What a week of spending collects, capped.
 *
 * The cap is applied here rather than at the call site because every figure on
 * the screen — this week, the projection, the comparison between settings —
 * has to be the capped one or the projection quietly promises more than the
 * product would ever take.
 */
export function weeklyRoundUp(purchases: Purchase[], rounding: number): number {
  const raw = purchases.reduce(
    (sum, purchase) => sum + roundUpFor(purchase.amount, rounding),
    0
  );
  return round2(Math.min(raw, roundUps.weeklyCap));
}

export interface FundProjection {
  /** What goes in each week, round-ups included. */
  weekly: number;
  /** Weeks until the goal is met at that rate, or null if it never is. */
  weeks: number | null;
  /** The date the goal is reached, or null. */
  goalDate: string | null;
  /** What the fund holds on the day the fixed term ends. */
  atMoveDate: number;
  /** How far short of the goal that is. Zero when it makes it. */
  shortfall: number;
  /** Whether the money is there in time, which is the whole question. */
  inTime: boolean;
}

/**
 * The fund measured against the move it is for.
 *
 * `atMoveDate` deliberately uses the real number of days rather than whole
 * weeks: rounding 42.7 weeks up to 43 would credit a contribution that has not
 * happened yet and turn a near miss into a pass.
 */
export function projectFund(saved: number, weekly: number): FundProjection {
  const remaining = Math.max(0, round2(movingFund.goal - saved));
  const weeksToMove = daysBetween(TODAY, tenancy.endDate) / 7;
  // Whole dollars: this is a projection off an average week of spending, and
  // quoting it to the cent claims a precision it does not have.
  const atMoveDate = Math.round(saved + weeksToMove * weekly);

  const weeks = weekly > 0 && remaining > 0 ? Math.ceil(remaining / weekly) : remaining > 0 ? null : 0;

  return {
    weekly: round2(weekly),
    weeks,
    goalDate: weeks === null ? null : addWeeks(TODAY, weeks),
    atMoveDate,
    shortfall: Math.max(0, Math.round(movingFund.goal - atMoveDate)),
    inTime: atMoveDate >= movingFund.goal,
  };
}

/**
 * The smallest rounding that gets the fund there in time, if there is one.
 *
 * Offering the largest would collect more and look better on a chart. The
 * point is to clear the goal, not to maximise what we sweep out of someone's
 * account, so this stops at the first setting that works.
 */
export function roundingThatMakesIt(
  purchases: Purchase[],
  saved: number,
  autoTopUp: number,
  current: number
): { rounding: number; projection: FundProjection } | null {
  for (const rounding of roundUps.options) {
    if (rounding <= current) continue;
    const projection = projectFund(
      saved,
      autoTopUp + weeklyRoundUp(purchases, rounding)
    );
    if (projection.inTime) return { rounding, projection };
  }
  return null;
}
