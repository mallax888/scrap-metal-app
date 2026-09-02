import Link from "next/link";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex items-center gap-3">
        <PiggyBadge className="h-11 w-11" />
        <Wordmark className="text-lg" />
      </div>
      <p className="numeric mt-10 text-[64px] font-semibold leading-none text-ink">404</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-mist">
        The link may be out of date. Your bond, payments and rewards are all still where you left
        them.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-bark px-5 text-sm font-medium text-cream shadow-card transition-colors hover:bg-ink"
      >
        Back to your overview
      </Link>
    </div>
  );
}
