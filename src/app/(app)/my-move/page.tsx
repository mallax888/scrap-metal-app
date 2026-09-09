import { PageHeader } from "@/components/ui/PageHeader";
import { MyMove } from "@/components/move/MyMove";
import { renter } from "@/lib/data";

/**
 * The first screen behind the sidebar.
 *
 * It used to be the repayment dashboard, which made the loan look like the
 * product. The move is the product; the loan is one line of it.
 */
export default function MyMovePage() {
  return (
    <>
      <PageHeader
        eyebrow="Your move"
        title={`${renter.firstName}\u2019s move`}
        subtitle="A tenancy your agency confirmed, and every cost that came with moving into it."
      />
      <MyMove />
    </>
  );
}
