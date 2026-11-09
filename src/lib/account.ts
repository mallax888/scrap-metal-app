import { bond, plan, tenancy } from "./data";

/**
 * The tenancy and facility the signed-in app is about.
 *
 * Everything behind the sidebar used to read the sample tenant straight out
 * of data.ts: one property, one rent, one $2,800 bond, one $56.54 a week. So
 * someone could walk the flow on a $1,000 rent, sign, open their account and
 * find a $700 tenancy they had never seen — the figures they had just agreed
 * to replaced by a stranger's on the screen that was supposed to be theirs.
 *
 * This is the one shape those screens read instead. It is the sample until
 * somebody signs, and their own figures afterwards, so the app has a single
 * answer to "whose tenancy is this" rather than one per component.
 *
 * What it deliberately does NOT carry is the repayment history. A freshly
 * funded plan is ten weeks short of the story the demo exists to tell — the
 * payments made, the score built on them, the rewards earned. Those stay on
 * the sample timeline and are re-derived against whatever the weekly payment
 * now is, so the history stays internally consistent without pretending a
 * brand-new account has a past.
 */
export interface Account {
  /** True once a plan has been signed in this browser. */
  funded: boolean;

  property: string;
  suburb: string;
  agencyName: string;
  rentWeekly: number;
  tenancyStart: string;
  tenancyEnd: string;

  /** The statutory bond, lodged with Tenancy Services in the landlord's name. */
  bond: number;
  bondId: string;
  lodgedWith: string;
  lodgedDate: string;

  /** What Litchi's partner advanced, which is not always the whole bond. */
  advance: number;
  weekly: number;
  termWeeks: number;
  totalRepayable: number;
  nextPaymentDate: string;
  /** The product's name, so the app can say which one this is. */
  product: string;

  /** The whole move, and who paid for which part of it. */
  moveTotal: number;
  paidSelf: number;
  booked: number;
}

/** What is stored when somebody signs. The rest of an Account is derived. */
export interface FundedPlan {
  property: string;
  suburb: string;
  agencyName: string;
  rentWeekly: number;
  tenancyStart: string;
  tenancyEnd: string;
  bond: number;
  advance: number;
  weekly: number;
  termWeeks: number;
  totalRepayable: number;
  nextPaymentDate: string;
  product: string;
  moveTotal: number;
  paidSelf: number;
  booked: number;
  /** When it was signed, for the documents and activity screens. */
  signedDate: string;
}

/** The demo tenant: who the account belongs to until somebody signs. */
export const sampleAccount: Account = {
  funded: false,
  property: tenancy.property,
  suburb: tenancy.suburb,
  agencyName: tenancy.landlordAgency,
  rentWeekly: tenancy.rentWeekly,
  tenancyStart: tenancy.startDate,
  tenancyEnd: tenancy.endDate,
  bond: bond.amount,
  bondId: bond.bondId,
  lodgedWith: bond.lodgedWith,
  lodgedDate: bond.lodgedDate,
  advance: plan.principal,
  weekly: plan.weeklyPayment,
  termWeeks: plan.termWeeks,
  totalRepayable: plan.totalRepayable,
  nextPaymentDate: plan.nextPaymentDate,
  product: "Bond Assist",
  moveTotal: 5300,
  paidSelf: 1850,
  booked: 650,
};

/**
 * The account to show: the signed plan if there is one, else the sample.
 *
 * The bond reference and lodgement date stay the sample's. A real one comes
 * back from Tenancy Services days after the money moves, and inventing a
 * plausible-looking reference number for a tenancy that does not exist is
 * exactly the kind of detail a prototype should not fake.
 */
export function accountFrom(funded: FundedPlan | null | undefined): Account {
  if (!funded) return sampleAccount;
  return {
    ...sampleAccount,
    funded: true,
    property: funded.property,
    suburb: funded.suburb,
    agencyName: funded.agencyName,
    rentWeekly: funded.rentWeekly,
    tenancyStart: funded.tenancyStart,
    tenancyEnd: funded.tenancyEnd,
    bond: funded.bond,
    advance: funded.advance,
    weekly: funded.weekly,
    termWeeks: funded.termWeeks,
    totalRepayable: funded.totalRepayable,
    nextPaymentDate: funded.nextPaymentDate,
    product: funded.product,
    moveTotal: funded.moveTotal,
    paidSelf: funded.paidSelf,
    booked: funded.booked,
  };
}
