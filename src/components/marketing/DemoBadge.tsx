import { clsx } from "clsx";

/**
 * Says outright that this is a prototype.
 *
 * The app presents a consumer credit product with fabricated figures at a
 * public URL. Someone sent the link with no context could reasonably take it
 * for a live account, so the disclosure is part of the page rather than
 * something the sender has to remember to say.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <p
      className={clsx(
        "inline-flex items-start gap-2 rounded-full border border-sand bg-paper px-3.5 py-1.5 text-[12px] font-medium leading-relaxed text-mist",
        className
      )}
    >
      {/* Aligned to the first line, since the label wraps on a narrow screen. */}
      <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-litchi" aria-hidden />
      Design prototype — sample data, not a real account
    </p>
  );
}
