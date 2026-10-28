import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My tenancy",
  description:
    "Your verified tenancy, what the move cost, and who paid each part. The finance is one line of it.",
};

export default function MyTenancyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
