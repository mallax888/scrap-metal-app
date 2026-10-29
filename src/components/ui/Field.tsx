/**
 * A labelled form field, for the three flows that ask people to type things.
 *
 * It exists to solve one problem: two fields side by side have to put their
 * inputs on the same line, and left to themselves they will not. They
 * disagree about everything above the input — one carries a hint and the
 * other does not, a hint wraps to two lines at one width and one at another,
 * and either may pick up an error. Stacked naively, each input starts
 * wherever its own preamble happens to end, and a tidy two-column row reads
 * as a mistake.
 *
 * So everything that varies goes in a block that grows to fill the row, and
 * the input is last. The grid stretches both fields to the same height, the
 * growing block absorbs the difference, and the inputs land level. A single
 * column on a phone is unaffected: there is no difference to absorb.
 *
 * The error sits above the input rather than below it, which is where the
 * GOV.UK Design System puts it too. It is read out before the thing it is
 * about, and from up there it cannot shove the input out of line with its
 * neighbour on the way in.
 *
 * This was three near-identical copies, one per flow, and the alignment bug
 * was in all three.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex h-full flex-col">
      <span className="block flex-1">
        <span className="block text-[13px] font-semibold text-ink">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-mist">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span className="mt-1.5 block text-xs font-medium text-litchi">
            {error}
          </span>
        ) : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

/** The one input style the flows share. Pair it with a height, e.g. `h-12`. */
export const inputClass =
  "tap w-full rounded-tile border border-sand bg-paper px-4 text-[15px] text-ink outline-none transition-colors focus:border-clay";
