import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Answers about your bond, your payments and your Litchi agreement — and a way to reach a person.",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
