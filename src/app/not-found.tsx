import Link from "next/link";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { ButtonLink } from "@/components/ui/Button";
import { APP_HOME, HOME_HREF } from "@/lib/nav";

/**
 * Sits outside the (app) group, so it renders without the sidebar. That means
 * it has to carry its own way back — and since an unmatched URL could be
 * someone mistyping a dashboard route or arriving cold from a stale link, it
 * offers both destinations rather than guessing.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <Link href={HOME_HREF} className="flex items-center gap-3">
        <PiggyBadge className="h-11 w-11" />
        <Wordmark className="text-lg" />
      </Link>
      <p className="numeric mt-12 text-[64px] font-semibold leading-none tracking-[-0.02em] text-ink">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist">
        The link may be out of date. Your bond, payments and rewards are all still where you left
        them.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={APP_HOME} size="lg">
          Back to your overview
        </ButtonLink>
        <ButtonLink href={HOME_HREF} size="lg" variant="ghost">
          What is Litchi?
        </ButtonLink>
      </div>
    </main>
  );
}
