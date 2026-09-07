/**
 * The guided walkthrough.
 *
 * The app is nine screens that each answer a question, and nobody arriving at
 * a link reads nine screens. The tour is not a new demo — it is a running
 * order over the demo that already exists, so a stranger sees the argument in
 * the order it makes sense rather than in the order the sidebar happens to be
 * in.
 *
 * Each stop names one thing to look at. If a stop cannot be reduced to one
 * thing, it is two stops or it does not belong.
 */
export interface TourStop {
  /** The screen this stop lives on. */
  href: string;
  /** Sidebar-length name, for the rail and the overview list. */
  label: string;
  /** The claim this screen is here to make. */
  title: string;
  /** What to actually look at, in one sentence. */
  look: string;
}

export const TOUR: TourStop[] = [
  {
    href: "/dashboard",
    label: "The plan",
    title: "One tenancy, ten weeks in",
    look: "The bond was paid up front and is being repaid weekly. Every figure on every screen from here comes off this one schedule.",
  },
  {
    href: "/bond",
    label: "Whose bond it is",
    title: "The bond is not ours, and neither is the rent",
    look: "The bond sits with Tenancy Services in the landlord's name. Scroll down for rent and the Litchi payment side by side — two payments, never added together — and for what happens when the tenancy ends.",
  },
  {
    href: "/payments",
    label: "A bad week",
    title: "What happens when a payment fails",
    look: "Use the demo controls to miss a payment. No late fee, nothing reported to a credit bureau, and a person rings you — that is the whole escalation.",
  },
  {
    href: "/score",
    label: "The score moves",
    title: "It answers to behaviour, not to a constant",
    look: "After that missed payment the score has actually dropped and the reason says why. Catch it up and it returns — but never higher than if you had not missed.",
  },
  {
    href: "/apply",
    label: "Who we say yes to",
    title: "An affordability test, shown in full",
    look: "Change the rent or the income and the decision changes with it. Every check that produced the answer is listed, including the ones that failed.",
  },
  {
    href: "/agents",
    label: "The agency's side",
    title: "What a property manager sees",
    look: "Open any tenancy in the list. The panel on the right — everything the agency is not told about the tenant — is the one that matters.",
  },
];

/** The query parameter the rail reads. Kept in the URL so a step is shareable. */
export const TOUR_PARAM = "tour";

/**
 * Which stop a URL is asking for, or null for "not on the tour".
 *
 * Deliberately strict: a nonsense value leaves the rail off the page rather
 * than guessing at a step, because a rail pointing at the wrong screen is
 * worse than no rail.
 */
export function stopIndexFrom(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > TOUR.length) return null;
  return n - 1;
}

/** The href for a given stop, with the tour position attached. */
export function stopHref(index: number): string {
  const stop = TOUR[index];
  return `${stop.href}?${TOUR_PARAM}=${index + 1}`;
}
