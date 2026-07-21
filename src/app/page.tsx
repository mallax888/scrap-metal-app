import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PriceTicker } from "@/components/PriceTicker";

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Live scrap metal prices
          </h1>
          <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
            No login needed to browse. See what your metal is worth right now, then get an
            instant quote in seconds.
          </p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600 whitespace-nowrap"
        >
          Sell my scrap
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <PriceTicker />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-500">1. Get a quote</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Pick your metal and estimated weight for an instant indicative price.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-500">2. Pickup or drop-off</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Book a pickup or find the nearest yard that pays your price.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-500">3. Track and get paid</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Follow your request from quoted to paid, and watch your sales add up.
          </p>
        </div>
      </section>
    </div>
  );
}
