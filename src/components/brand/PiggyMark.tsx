/**
 * The Litchi mark: a front-facing piggy bank — round body, ears angled out, a
 * big central snout with two upright nostrils, and wide-set eyes. Drawn flat as
 * a solid silhouette with the face knocked out of it, so it holds together at
 * favicon size where a shaded or outlined mark would fall apart.
 *
 * `accent` is the colour of the knocked-out face, so it has to match whatever
 * the mark sits on (the canvas by default).
 */
export function PiggyMark({
  className,
  accent = "var(--canvas)",
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
      {/* ears */}
      <path d="M9.7 14.9C7.5 10.5 6.9 6.5 8.3 5.3c1.4-1.1 5.2 1.2 8.6 4.6z" />
      <path d="M30.3 14.9c2.2-4.4 2.8-8.4 1.4-9.6-1.4-1.1-5.2 1.2-8.6 4.6z" />
      {/* head */}
      <circle cx="20" cy="20.4" r="12.4" />
      {/* eyes */}
      <circle cx="13.7" cy="14.6" r="2.15" fill={accent} />
      <circle cx="26.3" cy="14.6" r="2.15" fill={accent} />
      {/* snout */}
      <ellipse cx="20" cy="21" rx="6.4" ry="5.4" fill={accent} />
      <ellipse cx="17.8" cy="21" rx="1.15" ry="1.95" fill="currentColor" />
      <ellipse cx="22.2" cy="21" rx="1.15" ry="1.95" fill="currentColor" />
    </svg>
  );
}

/** Mark in a brand-brown chip — the app-icon lockup, reused in the sidebar. */
export function PiggyBadge({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[11px] bg-brand text-onbrand ${className}`}
    >
      <PiggyMark className="h-[74%] w-[74%]" accent="var(--brand)" />
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[0.18em] text-ink ${className}`}>LITCHI</span>
  );
}
