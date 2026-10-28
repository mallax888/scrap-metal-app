import { agency, renter, tenancy } from "./data";
import { addMonths } from "./format";
import { RTA_CAPS } from "./move";

/**
 * Tenancy verification: the part of Litchi that is not a lending feature.
 *
 * Every other rental finance product has to take the applicant's word for what
 * they are moving into. Litchi asks for the tenancy agreement, reads it, and
 * then asks the property manager named on it to confirm the handful of facts
 * that matter. That does three things at once, which is why it is worth the
 * friction: it removes the tenant's incentive to overstate the bond, it gives
 * the lender source-verified obligations instead of self-reported ones, and it
 * puts Litchi in front of the agency — who is the distribution channel.
 *
 * The privacy line is drawn deliberately tight. A tenancy agreement is full of
 * personal information about the tenant and often the landlord, and none of it
 * needs to travel. The agent is shown only the fields they are being asked to
 * confirm, all of which they already hold, and is told nothing at all about
 * the finance.
 */

/**
 * How sure the extraction is about a field.
 *
 * Modelled rather than hidden because a confirmation screen that presents
 * guesses with the same confidence as certainties trains people to click
 * through it. The low-confidence fields are the ones worth a second look, and
 * saying so is what makes the step real.
 */
export type Confidence = "high" | "medium" | "low";

export interface ExtractedField<T> {
  value: T;
  confidence: Confidence;
  /** Where in the document it came from, so a person can check it. */
  source: string;
}

export interface ExtractedTenancy {
  tenantName: ExtractedField<string>;
  property: ExtractedField<string>;
  suburb: ExtractedField<string>;
  weeklyRent: ExtractedField<number>;
  bond: ExtractedField<number>;
  startDate: ExtractedField<string>;
  endDate: ExtractedField<string | null>;
  manager: ExtractedField<string>;
  agencyName: ExtractedField<string>;
  landlord: ExtractedField<string | null>;
}

/**
 * What a tenancy agreement gives up when you read it.
 *
 * A stand-in for document extraction. The shape is the point: a real
 * implementation returns exactly this — values with confidences and a citation
 * — and everything downstream is written against that rather than against a
 * clean set of facts that never comes back from a scanned PDF.
 */
export function extractTenancy(fileName: string): ExtractedTenancy {
  const scanned = /scan|photo|img|jpe?g|png/i.test(fileName);
  // A phone photo of a printed agreement reads worse than an emailed PDF, and
  // the handwritten fields are the first to suffer.
  const soft = (c: Confidence): Confidence => (scanned ? (c === "high" ? "medium" : "low") : c);

  // The agreement being uploaded is the one the journey is about, so it is
  // read off the same verification request the agency is then asked to
  // confirm. Deriving it from anywhere else is how the application came to
  // show one address and the agency another.
  const applying = findVerification(DEMO_VERIFICATION_TOKEN);

  return {
    tenantName: {
      value: applying?.tenantName ?? `${renter.firstName} ${renter.lastName}`,
      confidence: soft("high"),
      source: "Clause 1 — The parties",
    },
    property: {
      value: applying?.property ?? tenancy.property,
      confidence: soft("high"),
      source: "Clause 2 — The premises",
    },
    suburb: {
      value: applying?.suburb ?? tenancy.suburb,
      confidence: soft("high"),
      source: "Clause 2 — The premises",
    },
    weeklyRent: {
      value: applying?.weeklyRent ?? tenancy.rentWeekly,
      confidence: soft("high"),
      source: "Clause 5 — Rent",
    },
    bond: {
      value: applying?.bond ?? tenancy.rentWeekly * RTA_CAPS.bondWeeks,
      confidence: soft("medium"),
      source: "Clause 6 — Bond",
    },
    startDate: {
      value: applying?.startDate ?? tenancy.startDate,
      confidence: soft("high"),
      source: "Clause 3 — Term",
    },
    endDate: {
      // A twelve-month fixed term from the start date, which is what these
      // agreements almost always say.
      value: applying ? addMonths(applying.startDate, 12) : tenancy.endDate,
      confidence: soft("medium"),
      source: "Clause 3 — Term",
    },
    manager: {
      value: applying?.manager ?? agency.manager,
      confidence: soft("low"),
      source: "Signature block",
    },
    agencyName: {
      value: applying?.agencyName ?? tenancy.landlordAgency,
      confidence: soft("high"),
      source: "Clause 1 — The parties",
    },
    landlord: { value: null, confidence: "low", source: "Not stated — managed tenancy" },
  };
}

/** Fields worth a second look before anything is sent to an agent. */
export function lowConfidenceFields(extracted: ExtractedTenancy): string[] {
  const labels: Record<string, string> = {
    tenantName: "Your name",
    property: "Address",
    suburb: "Suburb",
    weeklyRent: "Weekly rent",
    bond: "Bond",
    startDate: "Start date",
    endDate: "End date",
    manager: "Property manager",
    agencyName: "Agency",
    landlord: "Landlord",
  };
  return Object.entries(extracted)
    .filter(([, field]) => (field as ExtractedField<unknown>).confidence === "low")
    .map(([key]) => labels[key] ?? key);
}

export type VerificationStatus = "awaiting" | "verified" | "disputed";

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  awaiting: "Awaiting tenancy verification",
  verified: "Tenancy verified",
  disputed: "Details queried by the agency",
};

export interface VerificationRequest {
  /** What goes in the link. Single-use and short-lived in a real build. */
  token: string;
  tenantName: string;
  property: string;
  suburb: string;
  weeklyRent: number;
  bond: number;
  startDate: string;
  manager: string;
  agencyName: string;
  status: VerificationStatus;
  requestedAt: string;
  respondedAt: string | null;
  /** How the tenant reached Litchi, so the channel can be measured. */
  source: string;
}

/**
 * Verification requests as an agency sees them.
 *
 * The first is the tenancy the rest of the app belongs to, already confirmed.
 * The rest are the queue — which is what makes the agent portal a place
 * somebody returns to rather than a one-off screen.
 */
export const verificationRequests: VerificationRequest[] = [
  {
    token: "vt-284731",
    tenantName: "Malcolm Moffett",
    property: "12 Example Street",
    suburb: "Mount Eden",
    weeklyRent: 700,
    bond: 2800,
    startDate: "2026-07-14",
    manager: "Priya Raman",
    agencyName: "Example Property Co.",
    status: "verified",
    requestedAt: "2026-07-02",
    respondedAt: "2026-07-03",
    source: "Property approval email",
  },
  {
    token: "vt-291044",
    tenantName: "Tere Ngata",
    property: "5/218 Sandringham Road",
    suburb: "Sandringham",
    weeklyRent: 620,
    bond: 2480,
    startDate: "2026-08-22",
    manager: "Priya Raman",
    agencyName: "Example Property Co.",
    status: "verified",
    requestedAt: "2026-08-10",
    respondedAt: "2026-08-11",
    source: "Agency referral link",
  },
  {
    token: "vt-302188",
    tenantName: "Sam Iosefa",
    property: "Unit 9, 33 Rialto Street",
    suburb: "New Lynn",
    weeklyRent: 560,
    bond: 2240,
    startDate: "2026-09-26",
    manager: "Priya Raman",
    agencyName: "Example Property Co.",
    status: "awaiting",
    requestedAt: "2026-09-08",
    respondedAt: null,
    source: "Agency referral link",
  },
  {
    token: "vt-302904",
    tenantName: "Aroha Wilson",
    property: "7 Kereru Lane",
    suburb: "Massey",
    weeklyRent: 700,
    bond: 2800,
    startDate: "2026-10-03",
    manager: "Priya Raman",
    agencyName: "Example Property Co.",
    status: "awaiting",
    requestedAt: "2026-09-09",
    respondedAt: null,
    source: "Direct — litchi.co.nz",
  },
];

/** The demo link the move journey hands you, so the loop can be closed. */
export const DEMO_VERIFICATION_TOKEN = "vt-302904";

export function findVerification(token: string): VerificationRequest | undefined {
  return verificationRequests.find((request) => request.token === token);
}

/**
 * The privacy boundary on the verification screen, stated on the screen.
 *
 * Everything in `shown` is something the agency wrote or already holds, so
 * confirming it discloses nothing new to them. Everything in `withheld` is
 * either the tenant's financial business or somebody else's personal
 * information, and none of it is needed to answer the only question being
 * asked.
 */
export const verificationDisclosure = {
  shown: [
    "The tenant's name, as it appears on the agreement",
    "The property, the weekly rent and the bond",
    "The tenancy start date",
  ],
  withheld: [
    "The tenancy agreement itself — you are not sent the document",
    "What the tenant has applied for, or how much",
    "Their income, employer, bank or credit history",
    "Whether they are approved, declined, or still deciding",
  ],
} as const;

/**
 * The same boundary, told to the tenant.
 *
 * The list above is written for the agent reading it on their own screen, and
 * pasting it onto the tenant's dashboard leaves them reading about "the
 * tenant" in the third person. Same four facts, second person.
 */
export const withheldFromAgency = [
  "Your tenancy agreement — they are never sent the document",
  "What you applied for, or how much",
  "Your income, employer, bank or credit history",
  "Whether you were approved, declined, or are still deciding",
] as const;

/* ------------------------------------------------------------------ *
 * Application status.
 *
 * The tracker exists because the honest answer to "where is my
 * application" is usually "with the lender", and a product that goes quiet
 * at exactly that point is the one people ring up about. Naming the stage
 * costs nothing and removes most of the calls.
 * ------------------------------------------------------------------ */

export type ApplicationStage =
  | "tenancy"
  | "verification"
  | "costs"
  | "submitted"
  | "assessment"
  | "decision"
  | "funded";

export interface StageDefinition {
  key: ApplicationStage;
  label: string;
  /** What is happening, and who is doing it. */
  detail: string;
  /** Whose court the ball is in. */
  owner: "you" | "agency" | "partner" | "litchi";
}

export const APPLICATION_STAGES: StageDefinition[] = [
  {
    key: "tenancy",
    label: "Tenancy uploaded",
    detail: "We read your agreement and you confirmed what it said.",
    owner: "you",
  },
  {
    key: "verification",
    label: "Tenancy verified",
    detail: "Your property manager confirmed the rent, bond and start date.",
    owner: "agency",
  },
  {
    key: "costs",
    label: "Move costed",
    detail: "Your line items, and how much of them you asked us to cover.",
    owner: "you",
  },
  {
    key: "submitted",
    label: "Application submitted",
    detail: "Sent to the finance partner with your verified tenancy attached.",
    owner: "litchi",
  },
  {
    key: "assessment",
    label: "Finance assessment",
    detail: "The partner runs its credit and affordability checks. Usually same day.",
    owner: "partner",
  },
  {
    key: "decision",
    label: "Decision",
    detail: "The partner decides. Litchi does not make this call and cannot overturn it.",
    owner: "partner",
  },
  {
    key: "funded",
    label: "Funds released",
    detail: "Paid out on your move dates, most of it straight to the people owed.",
    owner: "partner",
  },
];
