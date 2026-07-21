"use client";

import { useApp } from "@/lib/store";
import { getMetal } from "@/lib/metals";
import { PriceCard } from "./PriceCard";

export function PriceTicker() {
  const { prices } = useApp();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {prices.map((price) => (
        <PriceCard key={price.metal} metal={getMetal(price.metal)} price={price} />
      ))}
    </div>
  );
}
