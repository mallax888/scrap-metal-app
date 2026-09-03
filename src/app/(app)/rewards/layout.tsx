import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Litchi Rewards — points earned for paying on time, and what you can spend them on.",
};

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
