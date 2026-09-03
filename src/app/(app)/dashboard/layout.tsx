import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Your bond, your weekly repayment, and how much of it you have paid off so far.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
