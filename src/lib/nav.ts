import {
  CreditCard,
  FileText,
  Gauge,
  Home,
  LayoutGrid,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Where the product's own front door lives, as opposed to the dashboard. */
export const HOME_HREF = "/";

/**
 * The first screen behind the sidebar.
 *
 * The move, not the repayment dashboard. Whichever screen opens first is the
 * app's claim about what it is for, and a balance and a payoff date say
 * "this is a loan you are servicing". The verified tenancy and the costed
 * move say what Litchi actually is, so they go first and the plan sits
 * underneath them.
 */
export const APP_HOME = "/my-move";

export const NAV_ITEMS: NavItem[] = [
  { href: "/my-move", label: "My move", icon: Home },
  { href: "/bond", label: "My Bond", icon: ShieldCheck },
  { href: "/dashboard", label: "My plan", icon: LayoutGrid },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/services", label: "Cleaners & movers", icon: Truck },
  { href: "/moving-fund", label: "Moving Fund", icon: Target },
  { href: "/rewards", label: "Rewards", icon: Sparkles },
  { href: "/score", label: "Renter Score", icon: Gauge },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/support", label: "Support", icon: LifeBuoy },
];
