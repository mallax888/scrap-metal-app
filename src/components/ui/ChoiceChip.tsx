import { clsx } from "clsx";

/**
 * A pill you pick, rather than a button you press.
 *
 * Property size, repayment term, and how each move cost gets covered are all
 * the same interaction: a small set of options where exactly one is current.
 * Each had grown its own copy of the same twelve utility classes, which meant
 * four places to keep in step and four places for a selected state to drift.
 *
 * `aria-pressed` rather than a radio group because these sit inline in prose
 * and headers where a fieldset would be the wrong structure — the parent
 * supplies `role="group"` and a label, which is what tells a screen reader
 * these belong together.
 */
export function ChoiceChip({
  pressed,
  onClick,
  children,
  className,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "tap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
        pressed
          ? "bg-brand text-onbrand"
          : "border border-sand text-mist hover:bg-cream hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}
