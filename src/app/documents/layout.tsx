import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description: "Your tenancy agreement, bond lodgement receipt, Litchi agreement and statements.",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
