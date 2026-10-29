import { AppShell } from "@/components/layout/AppShell";
import { AccountGate } from "@/components/layout/AccountGate";

/**
 * Everything behind the sidebar. The landing page sits outside this group so
 * it can present the product to someone who has never seen it, rather than
 * dropping them into a signed-in dashboard with no explanation.
 *
 * The gate wraps the shell rather than the page inside it, because a visitor
 * who has not opened an account should not be looking at an account's
 * sidebar either — Rewards and Renter Score are not theirs yet.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGate>
      <AppShell>{children}</AppShell>
    </AccountGate>
  );
}
