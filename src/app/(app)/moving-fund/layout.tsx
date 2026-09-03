import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moving Fund",
  description: "Money set aside for your next move — separate from your bond, and yours to withdraw.",
};

export default function MovingFundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
