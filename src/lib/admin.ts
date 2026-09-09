import {
  defaultPartner,
  litchiRevenue,
  partnerEconomics,
  quoteMove,
  type FinancePartner,
  type PartnerCommercials,
} from "./move";

/**
 * The internal view: what the platform originated, and what Litchi earned.
 *
 * Two things this screen is for. The first is the ordinary one — a funnel, an
 * approval rate, and which agencies actually send business, because the whole
 * distribution strategy is a guess until somebody counts.
 *
 * The second matters more. Litchi's revenue is paid by the finance partner out
 * of the cost of credit, which means the terms are a negotiation with a hard
 * ceiling: whatever the partner pays Litchi has to come out of the same money
 * that covers its funding and its losses. Those levers are adjustable here
 * rather than compiled in, so the point at which the deal stops working for
 * the partner is something you can find on purpose instead of in a meeting.
 */

export type FacilityStatus = "assessing" | "declined" | "funded";

export interface Facility {
  id: string;
  tenant: string;
  agencyName: string;
  /** How the applicant reached Litchi. The distribution question, made countable. */
  source: string;
  amount: number;
  termWeeks: number;
  submittedOn: string;
  status: FacilityStatus;
  /** Why, for the declines. Kept because an approval rate without reasons is a number, not a signal. */
  reason?: string;
}

/** Everything that reached submission. Earlier stages never create a row. */
export const facilities: Facility[] = [
  { id: "LM-1041", tenant: "Malcolm Moffett", agencyName: "Example Property Co.", source: "Property approval email", amount: 5180, termWeeks: 52, submittedOn: "2026-07-02", status: "funded" },
  { id: "LM-1042", tenant: "Tere Ngata", agencyName: "Example Property Co.", source: "Agency referral link", amount: 4360, termWeeks: 52, submittedOn: "2026-08-10", status: "funded" },
  { id: "LM-1043", tenant: "Danielle Cooper", agencyName: "Harbourline Realty", source: "Agency referral link", amount: 6100, termWeeks: 52, submittedOn: "2026-08-18", status: "funded" },
  { id: "LM-1044", tenant: "Sam Iosefa", agencyName: "Example Property Co.", source: "Agency referral link", amount: 3920, termWeeks: 39, submittedOn: "2026-09-08", status: "assessing" },
  { id: "LM-1045", tenant: "Aroha Wilson", agencyName: "Example Property Co.", source: "Direct — litchi.co.nz", amount: 4740, termWeeks: 52, submittedOn: "2026-09-09", status: "assessing" },
  { id: "LM-1046", tenant: "Jordan Petelo", agencyName: "Harbourline Realty", source: "Agency referral link", amount: 5460, termWeeks: 52, submittedOn: "2026-08-24", status: "funded" },
  { id: "LM-1047", tenant: "Nadia Rahman", agencyName: "Kauri Property Group", source: "QR code at viewing", amount: 3280, termWeeks: 26, submittedOn: "2026-08-29", status: "funded" },
  { id: "LM-1048", tenant: "Chris Bellamy", agencyName: "Kauri Property Group", source: "QR code at viewing", amount: 7100, termWeeks: 52, submittedOn: "2026-09-01", status: "declined", reason: "Rent and repayment above 60% of income" },
  { id: "LM-1049", tenant: "Mereana Hape", agencyName: "Harbourline Realty", source: "Agency referral link", amount: 4980, termWeeks: 52, submittedOn: "2026-09-03", status: "funded" },
  { id: "LM-1050", tenant: "Owen Fitzgerald", agencyName: "Direct", source: "Direct — litchi.co.nz", amount: 2600, termWeeks: 26, submittedOn: "2026-09-04", status: "declined", reason: "Tenancy could not be verified by the agency" },
  { id: "LM-1051", tenant: "Priya Kaur", agencyName: "Example Property Co.", source: "Property approval email", amount: 5840, termWeeks: 52, submittedOn: "2026-08-06", status: "funded" },
  { id: "LM-1052", tenant: "Luke Tanoa", agencyName: "Kauri Property Group", source: "Agency referral link", amount: 4420, termWeeks: 39, submittedOn: "2026-08-20", status: "funded" },
  { id: "LM-1053", tenant: "Hana Wickham", agencyName: "Direct", source: "Direct — litchi.co.nz", amount: 3140, termWeeks: 26, submittedOn: "2026-09-05", status: "declined", reason: "Under three months in the role, no other income" },
  { id: "LM-1054", tenant: "Beau Ngatai", agencyName: "Harbourline Realty", source: "Agency referral link", amount: 6320, termWeeks: 52, submittedOn: "2026-07-28", status: "funded" },
];

/**
 * The stages before submission, which leave no facility behind.
 *
 * Counted separately because the drop-off between "started" and "verified" is
 * the number that decides whether tenancy verification is a moat or a leak,
 * and it is invisible if you only measure applications.
 */
export const pipeline = {
  started: 46,
  /** Two-thirds get as far as finding the agreement and uploading it. */
  tenancyUploaded: 31,
  /**
   * The real drop, and the one the copy tells you to watch: this step waits on
   * a property manager, so it is the only place in the funnel where losing
   * people is somebody else's decision rather than the tenant's.
   */
  tenancyVerified: 18,
} as const;

export interface Funnel {
  label: string;
  count: number;
  /** Share of the stage above it, so the drop-off is where you read it. */
  ofPrevious: number;
}

export function buildFunnel(): Funnel[] {
  const submitted = facilities.length;
  const decided = facilities.filter((f) => f.status !== "assessing").length;
  const funded = facilities.filter((f) => f.status === "funded").length;

  const rows: { label: string; count: number }[] = [
    { label: "Started a move", count: pipeline.started },
    { label: "Tenancy uploaded", count: pipeline.tenancyUploaded },
    { label: "Tenancy verified", count: pipeline.tenancyVerified },
    { label: "Application submitted", count: submitted },
    { label: "Decision returned", count: decided },
    { label: "Funded", count: funded },
  ];

  return rows.map((row, index) => ({
    ...row,
    ofPrevious: index === 0 ? 1 : rows[index - 1].count === 0 ? 0 : row.count / rows[index - 1].count,
  }));
}

export interface SourceRow {
  source: string;
  submitted: number;
  funded: number;
  originated: number;
  /** Litchi revenue attributable to the channel. */
  revenue: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What each acquisition channel is actually worth, at the current terms. */
export function buildSources(
  commercials: PartnerCommercials,
  partner: FinancePartner = defaultPartner
): SourceRow[] {
  const tuned: FinancePartner = { ...partner, commercials };
  const map = new Map<string, SourceRow>();

  for (const facility of facilities) {
    const row = map.get(facility.source) ?? {
      source: facility.source,
      submitted: 0,
      funded: 0,
      originated: 0,
      revenue: 0,
    };
    row.submitted += 1;
    if (facility.status === "funded") {
      const quote = quoteMove(facility.amount, facility.termWeeks, tuned);
      row.funded += 1;
      row.originated += facility.amount;
      row.revenue = round2(row.revenue + litchiRevenue(quote, tuned).total);
    }
    map.set(facility.source, row);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export interface BookTotals {
  submitted: number;
  funded: number;
  declined: number;
  approvalRate: number;
  originated: number;
  averageFacility: number;
  revenue: number;
  revenuePerFunded: number;
  /** What the partner keeps on the book once funding, losses and Litchi are paid. */
  partnerMargin: number;
  /** Weighted break-even loss rate across the funded book. */
  breakEvenLossRate: number;
}

export function buildTotals(
  commercials: PartnerCommercials,
  lossRate: number,
  costOfFunds: number,
  partner: FinancePartner = defaultPartner
): BookTotals {
  const tuned: FinancePartner = { ...partner, commercials };
  const funded = facilities.filter((f) => f.status === "funded");
  const decided = facilities.filter((f) => f.status !== "assessing");

  let originated = 0;
  let revenue = 0;
  let partnerMargin = 0;
  let breakEvenWeighted = 0;

  for (const facility of funded) {
    const quote = quoteMove(facility.amount, facility.termWeeks, tuned);
    const economics = partnerEconomics(quote, tuned, { lossRate, costOfFunds });
    originated += facility.amount;
    revenue += litchiRevenue(quote, tuned).total;
    partnerMargin += economics.partnerMargin;
    breakEvenWeighted += economics.breakEvenLossRate * facility.amount;
  }

  return {
    submitted: facilities.length,
    funded: funded.length,
    declined: decided.length - funded.length,
    approvalRate: decided.length === 0 ? 0 : funded.length / decided.length,
    originated,
    averageFacility: funded.length === 0 ? 0 : round2(originated / funded.length),
    revenue: round2(revenue),
    revenuePerFunded: funded.length === 0 ? 0 : round2(revenue / funded.length),
    partnerMargin: round2(partnerMargin),
    breakEvenLossRate: originated === 0 ? 0 : breakEvenWeighted / originated,
  };
}
