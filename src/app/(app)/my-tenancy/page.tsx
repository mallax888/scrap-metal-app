"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { MyTenancy } from "@/components/move/MyTenancy";
import { EcosystemGrid } from "@/components/dashboard/EcosystemGrid";
import { renter } from "@/lib/data";
import { useGreeting } from "@/lib/use-greeting";

/**
 * The first screen behind the sidebar.
 *
 * It used to be the repayment dashboard, which made the loan look like the
 * product. The move is the product; the loan is one line of it.
 *
 * The greeting and the product roadmap moved here with the front door. Both
 * are home-screen furniture — a welcome belongs where you land, and "what else
 * Litchi does" is an invitation rather than a detail of any one thing.
 */
export default function MyTenancyPage() {
  const greeting = useGreeting();

  return (
    <>
      <PageHeader
        title={
          <>
            {greeting}, {renter.firstName} <span aria-hidden>👋</span>
          </>
        }
        subtitle="A tenancy your agency confirmed, and every cost that came with moving into it."
      />

      <div className="space-y-6">
        <MyTenancy />
        <EcosystemGrid />
      </div>
    </>
  );
}
