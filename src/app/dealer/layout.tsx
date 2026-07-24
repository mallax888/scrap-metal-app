import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealer Dashboard | ScrapExchange",
};

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
