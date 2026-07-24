import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Portfolio | ScrapExchange",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
