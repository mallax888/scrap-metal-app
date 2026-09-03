import { AppShell } from "@/components/layout/AppShell";

/**
 * Everything behind the sidebar. The landing page sits outside this group so
 * it can present the product to someone who has never seen it, rather than
 * dropping them into a signed-in dashboard with no explanation.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
