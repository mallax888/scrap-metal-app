import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-700 p-10 text-center">
      <Compass className="h-10 w-10 text-stone-500" />
      <h1 className="text-xl font-semibold text-stone-50">Page not found</h1>
      <p className="text-stone-400">
        That page doesn&apos;t exist, or the link&apos;s out of date.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
      >
        Back to the market
      </Link>
    </div>
  );
}
