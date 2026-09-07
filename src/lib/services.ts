import {
  moveServices,
  plan,
  SERVICE_COMMISSION_RATE,
  SERVICE_TERM_WEEKS,
  type MoveService,
  type PropertySize,
} from "./data";

/**
 * Booking a cleaner and a truck, and paying for them.
 *
 * Litchi's revenue here is a commission from the provider, not a margin on
 * the tenant — the price is the provider's price whether it is booked through
 * Litchi or not. That matters commercially as well as ethically: it is the
 * only version of this that can be disclosed in the app without the offer
 * falling over, and an undisclosed markup is what turns a recommendation into
 * a sale.
 *
 * Financing is offered second, not first. Most people should pay for a clean
 * outright; spreading $1,100 over six months is for the week where finding it
 * at once is the difference between moving and not.
 */
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Quote {
  /** What the tenant pays the provider. */
  price: number;
  /** What Litchi is paid by the provider out of it. */
  commission: number;
}

export function quoteService(service: MoveService, size: PropertySize): Quote {
  const price = service.prices[size];
  return { price, commission: round2(price * SERVICE_COMMISSION_RATE) };
}

export interface BasketQuote {
  price: number;
  commission: number;
  /** The same flat fee the bond carries, if it is added to the plan. */
  fee: number;
  financedTotal: number;
  weekly: number;
  termWeeks: number;
  empty: boolean;
}

export function quoteBasket(selected: string[], size: PropertySize): BasketQuote {
  const chosen = moveServices.filter((s) => selected.includes(s.id));
  const price = chosen.reduce((sum, s) => sum + s.prices[size], 0);
  const commission = round2(price * SERVICE_COMMISSION_RATE);
  const fee = round2(price * plan.feeRate);
  const financedTotal = round2(price + fee);
  // Rounded up to the cent so the schedule can never finish a cent short.
  const weekly = price === 0 ? 0 : Math.ceil((financedTotal / SERVICE_TERM_WEEKS) * 100) / 100;
  return {
    price,
    commission,
    fee,
    financedTotal,
    weekly,
    termWeeks: SERVICE_TERM_WEEKS,
    empty: chosen.length === 0,
  };
}
