import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Renter Score",
  description:
    "Your Litchi Score, what goes into it, and how it changes over time. Not a credit score.",
};

export default function ScoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
