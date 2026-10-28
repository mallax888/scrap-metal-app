import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your plan",
  description:
    "Your weekly repayment, how much of the plan you have paid off, and when it finishes.",
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
