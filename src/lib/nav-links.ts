import { Coins, LineChart, Warehouse, Wallet, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Market", shortLabel: "Market", icon: LineChart },
  { href: "/sell", label: "Sell Scrap", shortLabel: "Sell", icon: Coins },
  { href: "/portfolio", label: "My Portfolio", shortLabel: "Portfolio", icon: Wallet },
  { href: "/dealer", label: "Dealer Dashboard", shortLabel: "Dealer", icon: Warehouse },
];
