import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My move",
  description:
    "Your verified tenancy, what the move cost, and who paid each part. The finance is one line of it.",
};

export default function MyMoveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
