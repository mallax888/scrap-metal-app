import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
  description: "Your upcoming Litchi payments, payment method, and full activity history.",
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
