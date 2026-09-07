import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { MoveServices } from "@/components/services/MoveServices";

export const metadata: Metadata = {
  title: "Cleaners & movers",
  description:
    "Book a vetted bond clean and a removal truck, pay the provider directly or spread it over your Litchi plan.",
};

/**
 * The second product.
 *
 * A bond is money; a clean and a truck are work — and the exit clean is what
 * decides whether the bond comes back whole. Putting them in the same app is
 * the difference between financing a cost and removing a hassle, which is the
 * thing Litchi says it is for.
 */
export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Moving"
        title="Cleaners &amp; movers"
        subtitle="The two jobs that decide whether your bond comes back and whether moving day goes wrong."
      />
      <MoveServices />
    </>
  );
}
