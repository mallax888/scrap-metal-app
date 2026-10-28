"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";

/**
 * One block of the home screen's board.
 *
 * The shape is fixed on purpose: an icon, a label, one figure, one line of
 * state, and exactly one way in. A tile that carries two numbers is a card,
 * and a card is what the home screen had too many of — six of them, each
 * arguing its case at length, which left nothing to glance at.
 *
 * The whole tile is the target rather than a link inside it, because a block
 * you can only enter through four words at the bottom is a card wearing a
 * tile's clothes. Tiles that open a panel below the board are buttons and say
 * so to a screen reader; tiles that go somewhere are links.
 */
export interface TileProps {
  icon: LucideIcon;
  /** The small uppercase heading. */
  label: string;
  /** The one number (or date, or address) the block is about. */
  figure: string;
  /** A unit that sits beside the figure at a smaller size — "a week". */
  unit?: string;
  /** One sentence of state under the figure. */
  state: React.ReactNode;
  /** The status pill in the top-right corner. */
  chip?: React.ReactNode;
  /** 0–1. Drawn as a hairline bar under the figure. */
  progress?: number;
  /** What the way in says. */
  action: string;
  tone?: "paper" | "ink";
  className?: string;
}

/** A figure longer than this is prose — an address or a date — not a number. */
const LONG_FIGURE = 12;

function TileBody({
  icon: Icon,
  label,
  figure,
  unit,
  state,
  chip,
  progress,
  action,
  tone,
  expandable,
  expanded,
}: TileProps & { expandable?: boolean; expanded?: boolean }) {
  const ink = tone === "ink";
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 sm:rounded-xl",
            ink ? "bg-onbrand/15 text-onbrand" : "bg-cream text-bark"
          )}
        >
          <Icon className="h-4 w-4 sm:h-[17px] sm:w-[17px]" aria-hidden />
        </span>
        {chip}
      </span>

      <span
        className={clsx(
          "mt-3.5 block text-[10px] font-semibold uppercase tracking-[0.13em] sm:mt-4 sm:text-[11px]",
          ink ? "text-onbrand/60" : "text-mist"
        )}
      >
        {label}
      </span>

      <span
        className={clsx(
          "numeric mt-2 block font-semibold tracking-[-0.03em]",
          figure.length > LONG_FIGURE
            ? "text-[17px] leading-tight tracking-[-0.02em] sm:text-[21px]"
            : "text-[23px] leading-none sm:text-[28px]"
        )}
      >
        {figure}
        {unit ? (
          <span
            className={clsx(
              "text-[13px] font-semibold tracking-[-0.01em] sm:text-[15px]",
              ink ? "text-onbrand/65" : "text-mist"
            )}
          >
            {" "}
            {unit}
          </span>
        ) : null}
      </span>

      {progress !== undefined ? (
        <span
          className={clsx(
            "mt-3.5 block h-1.5 overflow-hidden rounded-full",
            ink ? "bg-onbrand/20" : "bg-cream"
          )}
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-litchi"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </span>
      ) : null}

      <span
        className={clsx(
          "mt-2.5 block text-[12px] leading-relaxed sm:text-[13px]",
          ink ? "text-onbrand/70" : "text-mist"
        )}
      >
        {state}
      </span>

      <span className="mt-auto flex items-center gap-1.5 pt-4 text-[12px] font-semibold sm:text-[13px]">
        <span className={ink ? "text-onbrand" : "text-bark"}>{action}</span>
        {expandable ? (
          <ChevronDown
            className={clsx(
              "h-4 w-4 transition-transform duration-200",
              ink ? "text-onbrand" : "text-bark",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        ) : (
          <ArrowRight className={clsx("h-4 w-4", ink ? "text-onbrand" : "text-bark")} aria-hidden />
        )}
      </span>
    </>
  );
}

const SHELL =
  "flex min-w-0 flex-col rounded-card p-4 text-left transition-[border-color,box-shadow,transform] duration-200 sm:p-5";

const TONES = {
  paper: "border border-sand/70 bg-paper text-ink hover:border-clay/60 hover:shadow-card",
  /* The warm edge is for the dark theme, where the hero slab and paper sit
     one shade apart and the lead block would otherwise stop leading. */
  ink: "border border-bark/30 bg-hero text-onbrand hover:shadow-lift",
} as const;

/** A block that takes you somewhere else. */
export function TileLink({ href, ...tile }: TileProps & { href: string }) {
  return (
    <Link href={href} className={clsx(SHELL, TONES[tile.tone ?? "paper"], tile.className)}>
      <TileBody {...tile} />
    </Link>
  );
}

/** A block that opens a panel underneath the board instead of navigating. */
export function TileButton({
  onClick,
  expanded,
  controls,
  ...tile
}: TileProps & { onClick: () => void; expanded: boolean; controls: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      className={clsx(
        SHELL,
        TONES[tile.tone ?? "paper"],
        expanded && (tile.tone === "ink" ? "shadow-lift" : "border-clay/60 shadow-card"),
        tile.className
      )}
    >
      <TileBody {...tile} expandable expanded={expanded} />
    </button>
  );
}
