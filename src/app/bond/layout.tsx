import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Bond",
  description:
    "Your bond amount, where it is lodged, and how your Litchi Bond Assist finance works.",
};

export default function BondLayout({ children }: { children: React.ReactNode }) {
  return children;
}
