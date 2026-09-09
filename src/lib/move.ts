import { moveServices, tenancy, type PropertySize } from "./data";

/**
 * Litchi Move: the facility that covers a move, not just the bond.
 *
 * The bond is still the hero — it is the largest line, it is capped by statute
 * so it can be derived rather than guessed, and it is paid to a trust account
 * rather than to the tenant. But a bond is not the whole problem. Rent in
 * advance, a truck, and the clean on the place you are leaving all fall due in
 * the same fortnight, and financing one of the four leaves someone three short.
 *
 * Two design rules run through this file, and both exist to keep this a
 * rental-specific product rather than a personal loan with a moving-themed
 * skin.
 *
 * The first is that the amount is a *consequence* of the costs, never a
 * separate choice. You cannot ask for more than the move costs. A slider that
 * runs past the total would turn a considered list into an invitation, which
 * is the opposite of what the calculator is for.
 *
 * The second is direct disbursement. Almost every line here is paid to the
 * party that raised the cost — the agent's trust account, the mover, the
 * cleaner — so the money never lands in the tenant's account and cannot be
 * spent on something else. That is better for the tenant, who does not have to
 * hold and forward it, and it is the single most important thing a lender is
 * told about this product: the use of funds is verified, not asserted.
 */

/**
 * The two caps the Residential Tenancies Act puts on what a landlord may
 * require, which is why the two largest lines can be derived from the rent
 * rather than typed in.
 */
export const RTA_CAPS = {
  /** s.18 — a bond may not exceed four weeks' rent. */
  bondWeeks: 4,
  /** s.23 — rent may not be required more than two weeks in advance. */
  rentInAdvanceWeeks: 2,
  /**
   * s.18AA — a pet bond, capped at two weeks' rent and one at a time. New:
   * the pet-friendly tenancy rules only came into force on 1 December 2025,
   * so this is a real upfront cost that most moving checklists predate.
   */
  petBondWeeks: 2,
} as const;

/** Who the money actually goes to when the facility is drawn down. */
export type Payee = "agent" | "provider" | "tenant";

export const PAYEE_LABELS: Record<Payee, string> = {
  agent: "Paid direct to the agency's trust account",
  provider: "Paid direct to the provider",
  tenant: "Paid to your bank account",
};

export interface MoveCostLine {
  id: string;
  label: string;
  /** What the line is, in the tenant's words. */
  detail: string;
  amount: number;
  payee: Payee;
  /** Who receives it, once we know the tenancy. */
  payeeName: string;
  /** Where a statutory cap applies, so the field can refuse to exceed it. */
  max?: number;
  /** Why the cap exists, shown next to the field rather than in a footnote. */
  capNote?: string;
  /** On by default because it is all but certain to apply. */
  selected: boolean;
}

/**
 * The move, costed from the verified tenancy.
 *
 * Bond and rent in advance come straight off the weekly rent, so for a
 * verified tenancy they are facts rather than estimates. The service lines are
 * seeded from the same shortlist of operators the rest of the app uses, so a
 * tenant who books through Litchi gets the price they were quoted here.
 */
export function buildMoveCosts(
  weeklyRent: number,
  size: PropertySize,
  agencyName: string = tenancy.landlordAgency
): MoveCostLine[] {
  const removals = moveServices.find((s) => s.id === "removals");
  const clean = moveServices.find((s) => s.id === "bond-clean");
  const bondMax = Math.round(weeklyRent * RTA_CAPS.bondWeeks);
  const advanceMax = Math.round(weeklyRent * RTA_CAPS.rentInAdvanceWeeks);
  const petMax = Math.round(weeklyRent * RTA_CAPS.petBondWeeks);

  return [
    {
      id: "bond",
      label: "Bond",
      detail: "Paid to your agent before you get the keys, then lodged with Tenancy Services.",
      amount: bondMax,
      payee: "agent",
      payeeName: agencyName,
      max: bondMax,
      capNote: `Capped at ${RTA_CAPS.bondWeeks} weeks' rent by the Residential Tenancies Act.`,
      selected: true,
    },
    {
      id: "rent-advance",
      label: "Rent in advance",
      detail: "What the agency asks for before the tenancy starts.",
      amount: advanceMax,
      payee: "agent",
      payeeName: agencyName,
      max: advanceMax,
      capNote: `A landlord cannot require more than ${RTA_CAPS.rentInAdvanceWeeks} weeks in advance.`,
      selected: true,
    },
    {
      id: "pet-bond",
      label: "Pet bond",
      detail: "If a pet is coming with you. A separate bond, lodged the same way as the first.",
      amount: petMax,
      payee: "agent",
      payeeName: agencyName,
      max: petMax,
      capNote: `Capped at ${RTA_CAPS.petBondWeeks} weeks' rent, and only one at a time.`,
      selected: false,
    },
    {
      id: "removals",
      label: "Movers",
      detail: "A truck and two people for the day, booked for your possession date.",
      amount: removals ? removals.prices[size] : 650,
      payee: "provider",
      payeeName: removals ? removals.provider : "Your mover",
      selected: true,
    },
    {
      id: "bond-clean",
      label: "Bond clean",
      detail: "Of the place you're leaving. It decides how much of your old bond comes back.",
      amount: clean ? clean.prices[size] : 450,
      payee: "provider",
      payeeName: clean ? clean.provider : "Your cleaner",
      selected: true,
    },
    {
      id: "carpet",
      label: "Carpet cleaning",
      detail: "Often written into the tenancy agreement as a condition of leaving.",
      amount: 180,
      payee: "provider",
      payeeName: "Kōrero Clean",
      selected: false,
    },
    {
      id: "storage",
      label: "Storage",
      detail: "For the gap when the two tenancies don't quite meet.",
      amount: 0,
      payee: "provider",
      payeeName: "Storage operator",
      selected: false,
    },
    {
      id: "rubbish",
      label: "Rubbish removal",
      detail: "The trailer load that won't fit in the truck or the wheelie bin.",
      amount: 150,
      payee: "provider",
      payeeName: "Removal operator",
      selected: false,
    },
    {
      id: "other",
      label: "Something else",
      detail: "Another cost of this move. It's the only line paid to you rather than direct.",
      amount: 0,
      payee: "tenant",
      payeeName: "Your bank account",
      selected: false,
    },
  ];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The total of the lines that are switched on. */
export function costedTotal(lines: MoveCostLine[]): number {
  return lines.reduce((sum, line) => (line.selected ? sum + line.amount : sum), 0);
}

/**
 * How much of the facility never touches the tenant's account.
 *
 * The number a finance partner cares about most, so it is computed rather than
 * claimed.
 */
export function directShare(lines: MoveCostLine[]): number {
  const total = costedTotal(lines);
  if (total <= 0) return 1;
  const direct = lines.reduce(
    (sum, line) => (line.selected && line.payee !== "tenant" ? sum + line.amount : sum),
    0
  );
  return direct / total;
}

/* ------------------------------------------------------------------ *
 * How each cost gets handled.
 *
 * The important idea in the whole file. A costed move is worth something on
 * its own: knowing that this move is $5,300 and which $2,800 of it is legally
 * capped is useful whether or not anybody borrows a cent. So coverage is a
 * per-line choice with three answers, and financing is one of them rather
 * than the destination the screen is walking you towards.
 *
 * A calculator that only exists to produce a loan application is a loan
 * application with extra steps.
 * ------------------------------------------------------------------ */

export type Coverage = "self" | "book" | "litchi";

export const COVERAGE_LABELS: Record<Coverage, string> = {
  self: "I'll pay this myself",
  book: "Book it through Litchi",
  litchi: "Add it to my Litchi facility",
};

export const COVERAGE_SHORT: Record<Coverage, string> = {
  self: "Paying yourself",
  book: "Booked",
  litchi: "Financed",
};

/** Only a job done by a provider can be booked; a bond can only be paid. */
export function canBook(line: MoveCostLine): boolean {
  return line.payee === "provider";
}

/**
 * The opening position: the bond, and nothing else.
 *
 * It is the line people cannot cover and the reason they are here. Everything
 * else starts at "I'll pay this myself", so the total to finance goes up only
 * because someone chose to put it up.
 */
export function defaultCoverage(line: MoveCostLine): Coverage {
  return line.id === "bond" ? "litchi" : "self";
}

export interface CoverageSplit {
  self: number;
  booked: number;
  financed: number;
  total: number;
}

export function coverageSplit(
  lines: MoveCostLine[],
  coverage: Record<string, Coverage>
): CoverageSplit {
  const split: CoverageSplit = { self: 0, booked: 0, financed: 0, total: 0 };
  for (const line of lines) {
    if (!line.selected || line.amount <= 0) continue;
    const how = coverage[line.id] ?? defaultCoverage(line);
    split.total += line.amount;
    if (how === "litchi") split.financed += line.amount;
    else if (how === "book") split.booked += line.amount;
    else split.self += line.amount;
  }
  return split;
}

/* ------------------------------------------------------------------ *
 * Finance partners.
 *
 * Litchi is not the lender. It owns the customer, the tenancy verification
 * and the distribution; a licensed partner assesses, funds, and carries the
 * credit risk. Modelled as a list with commercial terms attached rather than
 * a single hard-coded lender, because the whole strategic point of the
 * platform is that the customer relationship belongs to Litchi and the
 * funding is replaceable.
 *
 * No routing engine here on purpose. With one partner a router is a guess
 * about a problem nobody has yet; what matters now is that nothing downstream
 * assumes there is only ever one.
 * ------------------------------------------------------------------ */

export interface PartnerCommercials {
  /** Paid to Litchi when a customer is funded. */
  originationFee: number;
  /** Paid to Litchi per active customer per month, for servicing the platform. */
  servicingMonthly: number;
  /** Litchi's share of the partner's cost of credit on the facility. */
  revenueShare: number;
}

export interface FinancePartner {
  id: string;
  name: string;
  /** Financial Service Providers Register number. */
  fspr: string;
  /** Every consumer lender must belong to an approved scheme. */
  disputesScheme: string;
  /** Annual interest rate on the reducing balance. */
  annualRate: number;
  establishmentFee: number;
  minAdvance: number;
  maxAdvance: number;
  termsWeeks: readonly number[];
  commercials: PartnerCommercials;
}

export const financePartners: FinancePartner[] = [
  {
    id: "kowhai",
    name: "Kōwhai Finance Ltd",
    fspr: "FSP-748219",
    disputesScheme: "Financial Services Complaints Ltd",
    annualRate: 0.1895,
    establishmentFee: 240,
    minAdvance: 500,
    maxAdvance: 10000,
    termsWeeks: [26, 39, 52],
    commercials: {
      originationFee: 225,
      servicingMonthly: 4,
      revenueShare: 0.1,
    },
  },
];

export const defaultPartner = financePartners[0];

export interface MoveQuote {
  /** What the tenant asked for, which can never exceed the costed total. */
  amount: number;
  establishmentFee: number;
  /** Advance plus the establishment fee — what interest is charged on. */
  financed: number;
  termWeeks: number;
  weekly: number;
  /** Trimmed so the schedule settles exactly rather than a few cents over. */
  finalPayment: number;
  totalRepayable: number;
  /** Everything the credit costs, over and above the amount advanced. */
  costOfCredit: number;
  annualRate: number;
}

/**
 * A weekly amortising quote.
 *
 * An establishment fee plus interest on the reducing balance, which is the
 * ordinary structure for consumer credit in New Zealand and the one a partner
 * will actually offer. Deliberately not dressed up as a flat "fee" — on a
 * facility this size a flat percentage large enough to fund the loan would be
 * a margin wearing a fee's name, and credit fees have to be reasonable under
 * the CCCFA rather than merely disclosed.
 */
export function quoteMove(
  amount: number,
  termWeeks: number,
  partner: FinancePartner = defaultPartner
): MoveQuote {
  const financed = round2(amount + partner.establishmentFee);
  const weeklyRate = partner.annualRate / 52;
  const factor = Math.pow(1 + weeklyRate, -termWeeks);
  // Rounded up to the cent so the balance can never finish short.
  const weekly = Math.ceil(((financed * weeklyRate) / (1 - factor)) * 100) / 100;
  const totalRepayable = round2(weekly * termWeeks);
  return {
    amount,
    establishmentFee: partner.establishmentFee,
    financed,
    termWeeks,
    weekly,
    finalPayment: round2(totalRepayable - weekly * (termWeeks - 1)),
    totalRepayable,
    costOfCredit: round2(totalRepayable - amount),
    annualRate: partner.annualRate,
  };
}

export interface LitchiRevenue {
  origination: number;
  /** Over the life of the facility, at the per-month rate. */
  servicing: number;
  revenueShare: number;
  total: number;
}

/** What Litchi earns on a funded facility. Paid by the partner, not the tenant. */
export function litchiRevenue(
  quote: MoveQuote,
  partner: FinancePartner = defaultPartner
): LitchiRevenue {
  const months = quote.termWeeks / (52 / 12);
  const origination = partner.commercials.originationFee;
  const servicing = round2(partner.commercials.servicingMonthly * months);
  const revenueShare = round2(quote.costOfCredit * partner.commercials.revenueShare);
  return {
    origination,
    servicing,
    revenueShare,
    total: round2(origination + servicing + revenueShare),
  };
}

/**
 * Whether the partner can actually afford to pay Litchi that.
 *
 * This is here rather than in a spreadsheet because it is the question that
 * decides whether the business exists, and because the answer is uncomfortable
 * enough that it should be in front of anyone changing the commercial terms.
 * The cost of credit has to cover the partner's funding, its expected losses,
 * *and* Litchi's cut. On a facility of this size and term it very nearly does
 * not — which is the whole argument for verified tenancies: they have to move
 * the loss rate, or the origination fee has to come down.
 */
export interface PartnerEconomics {
  costOfCredit: number;
  fundingCost: number;
  expectedLoss: number;
  litchiCost: number;
  partnerMargin: number;
  /** The loss rate at which the partner breaks even, all else held. */
  breakEvenLossRate: number;
}

export interface EconomicsAssumptions {
  /** What the partner pays for the money it lends. */
  costOfFunds: number;
  /** Expected credit losses as a share of the amount advanced. */
  lossRate: number;
}

export const ECONOMICS_ASSUMPTIONS: EconomicsAssumptions = {
  costOfFunds: 0.08,
  lossRate: 0.05,
};

export function partnerEconomics(
  quote: MoveQuote,
  partner: FinancePartner = defaultPartner,
  assumptions: EconomicsAssumptions = ECONOMICS_ASSUMPTIONS
): PartnerEconomics {
  // Roughly half the advance is outstanding on average across an amortising
  // term, which is close enough for a unit-economics readout.
  const averageBalance = quote.financed / 2;
  const years = quote.termWeeks / 52;
  const fundingCost = round2(averageBalance * assumptions.costOfFunds * years);
  const expectedLoss = round2(quote.amount * assumptions.lossRate);
  const litchiCost = litchiRevenue(quote, partner).total;
  const partnerMargin = round2(quote.costOfCredit - fundingCost - expectedLoss - litchiCost);
  const breakEvenLossRate =
    quote.amount > 0 ? (quote.costOfCredit - fundingCost - litchiCost) / quote.amount : 0;
  return {
    costOfCredit: quote.costOfCredit,
    fundingCost,
    expectedLoss,
    litchiCost,
    partnerMargin,
    breakEvenLossRate,
  };
}
