import {
  CreditCard,
  FileText,
  Gauge,
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

/** The first screen behind the sidebar. */
export const APP_HOME = "/dashboard";

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/bond", label: "My Bond", icon: ShieldCheck },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/rewards", label: "Rewards", icon: Sparkles },
  { href: "/score", label: "Renter Score", icon: Gauge },
  { href: "/services", label: "Cleaners & movers", icon: Truck },
  { href: "/moving-fund", label: "Moving Fund", icon: Target },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/support", label: "Support", icon: LifeBuoy },
];
