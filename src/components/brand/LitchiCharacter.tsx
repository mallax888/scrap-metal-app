/**
 * The Litchi character — a litchi with a face and limbs.
 *
 * This is deliberately *not* the logo. The mark has to survive 16px in a
 * browser tab; a character never does. This one only ever appears large and
 * briefly, in celebration moments, which is where a character earns its keep.
 */

/**
 * The bumpy litchi shell, as a closed Catmull-Rom curve through a wobbling
 * radius. Built once at module load rather than pasted in as 2KB of literal
 * path data, so the lobe count and depth stay legible and tunable.
 */
function shellPath({
  cx = 32,
  cy = 31,
  radius = 16.5,
  lobes = 11,
  depth = 1.25,
  steps = 44,
}: {
  cx?: number;
  cy?: number;
  radius?: number;
  lobes?: number;
  depth?: number;
  steps?: number;
} = {}): string {
  const points: [number, number][] = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + depth * Math.cos(lobes * angle);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < steps; i += 1) {
    const p0 = points[(i - 1 + steps) % steps];
    const p1 = points[i];
    const p2 = points[(i + 1) % steps];
    const p3 = points[(i + 2) % steps];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round(c1[0])} ${round(c1[1])},${round(c2[0])} ${round(c2[1])},${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d}Z`;
}

const SHELL = shellPath();

export function LitchiCharacter({
  className,
  accent = "var(--onbrand)",
  title = "Litchi",
}: {
  className?: string;
  /** Colour of the knocked-out face — must match what the body is drawn in. */
  accent?: string;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" role="img" aria-label={title}>
      <title>{title}</title>
      {/* leaf and stem */}
      <path d="M34.4 15.6C36.9 9.6 43.2 6.4 49.4 7.1c.6 6.2-3.4 11.7-9.4 13.2-2.2.5-4.2.2-5.6-.7z" />
      <path
        d="M32.6 20.4c0-2.6.5-4.8 1.6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* arms and legs, behind the body so they read as limbs not spikes */}
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M18.4 36.4 10.6 42.6" />
        <path d="M45.6 36.4 53.4 42.6" />
        <path d="M25.6 46.4v8.2" />
        <path d="M38.4 46.4v8.2" />
      </g>
      <path d={SHELL} />
      {/* face */}
      <circle cx="26.4" cy="29" r="2.7" fill={accent} />
      <circle cx="37.6" cy="29" r="2.7" fill={accent} />
      <path
        d="M27.2 36.4c2.6 2.8 7 2.8 9.6 0"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
