import {
  CreditCard,
  FileText,
  Gauge,
  LayoutGrid,
  LifeBuoy,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/bond", label: "My Bond", icon: ShieldCheck },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/rent", label: "Rent", icon: Receipt },
  { href: "/rewards", label: "Rewards", icon: Sparkles },
  { href: "/score", label: "Renter Score", icon: Gauge },
  { href: "/moving-fund", label: "Moving Fund", icon: Target },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/support", label: "Support", icon: LifeBuoy },
];
