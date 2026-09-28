import { clsx } from "clsx";

/**
 * The figure strip: a row of labelled numbers on hairline dividers.
 *
 * This shape had been hand-written seven times across the app — the same
 * `gap-px` grid over a sand background, the same uppercase label, the same
 * numeric value — differing only in incidentals nobody chose on purpose: a
 * 17px value here and a 19px one there, `py-3.5` in one and `py-4` in the
 * next. Those differences were drift, not design, so collapsing them into one
 * component both removes the repetition and settles the inconsistency.
 *
 * The grid draws its own dividers by showing a sand background through a
 * one-pixel gap between paper-coloured cells, which is why each cell sets its
 * own background and the container sets none.
 */
export interface Stat {
  label: string;
  value: string;
  /** A clarifying line under the figure. Rare — most figures speak for themselves. */
  note?: string;
}

const COLUMNS = {
  3: "sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const;

const SIZES = {
  md: "text-[17px]",
  lg: "text-[19px]",
} as const;

export function StatGrid({
  items,
  columns = 3,
  size = "md",
  className,
}: {
  items: Stat[];
  columns?: keyof typeof COLUMNS;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <dl
      className={clsx(
        "grid gap-px overflow-hidden rounded-tile border border-sand bg-sand",
        COLUMNS[columns],
        className
      )}
    >
      {/* A column with the value pushed to the floor: labels are not all the
          same length, and one that wraps to a second line would otherwise
          drop its figure below the others and break the row's baseline. */}
      {items.map((item) => (
        <div key={item.label} className="flex flex-col bg-paper px-4 py-3.5">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
            {item.label}
          </dt>
          <dd className={clsx("numeric mt-auto pt-1.5 font-semibold text-ink", SIZES[size])}>
            {item.value}
            {item.note ? (
              <span className="mt-1 block text-[12px] font-normal leading-relaxed tracking-normal text-mist">
                {item.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
