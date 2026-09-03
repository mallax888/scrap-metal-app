/**
 * The compact in-app counterpart to DemoBadge.
 *
 * Sits next to the wordmark on every screen behind the sidebar, on desktop and
 * mobile alike. Small enough not to fight the design, present enough that a
 * screenshot of any single page still carries the disclosure with it.
 */
export function DemoTag() {
  return (
    <span className="rounded-full border border-sand bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-clay">
      Demo
    </span>
  );
}
