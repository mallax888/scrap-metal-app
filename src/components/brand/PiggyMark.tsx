/**
 * The Litchi mark: an abstract piggy bank built from a solid silhouette, with
 * an "L" cut through the body that doubles as the coin slot. Deliberately
 * geometric — no cartoon face, no outlines, no gradients.
 *
 * `accent` is the colour of the cut-out, so it must match whatever the mark
 * sits on (the canvas by default).
 */
export function PiggyMark({
  className,
  accent = "var(--color-canvas)",
  title,
}: {
  className?: string;
  accent?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="currentColor"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {/* ear */}
      <path d="M11.8 13.4 13.7 6.3a1.4 1.4 0 0 1 2.2-.7l4.7 4.6z" />
      {/* body */}
      <rect x="5" y="11" width="26" height="19" rx="9.5" />
      {/* snout */}
      <rect x="25" y="15.5" width="10" height="9" rx="4.5" />
      {/* trotters */}
      <rect x="10" y="27" width="4.6" height="6.4" rx="2.3" />
      <rect x="21.4" y="27" width="4.6" height="6.4" rx="2.3" />
      {/* the L / coin slot */}
      <rect x="11.6" y="14.4" width="3.6" height="10.6" rx="1.8" fill={accent} />
      <rect x="11.6" y="21.4" width="9.2" height="3.6" rx="1.8" fill={accent} />
      {/* eye + nostril */}
      <circle cx="23.6" cy="16.8" r="1.25" fill={accent} />
      <circle cx="32.4" cy="20" r="1.15" fill={accent} />
    </svg>
  );
}

/** Mark in a brown chip — the app-icon lockup, reused in the sidebar. */
export function PiggyBadge({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[11px] bg-brand text-onbrand ${className}`}
    >
      <PiggyMark className="h-[70%] w-[70%]" accent="var(--color-bark)" />
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[0.18em] text-ink ${className}`}>LITCHI</span>
  );
}
