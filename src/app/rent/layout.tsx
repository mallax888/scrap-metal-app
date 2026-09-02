import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rent",
  description:
    "Your rent and your Litchi bond repayment, shown separately, plus your total weekly housing cost.",
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
