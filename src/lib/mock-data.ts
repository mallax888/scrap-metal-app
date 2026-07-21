import { MetalId, MetalPrice, Yard } from "./types";

// Indicative base prices (NZD/kg) — starting point for the live ticker demo.
const BASE_PRICES: Record<MetalId, number> = {
  copper: 11.2,
  aluminium: 1.85,
  steel: 0.32,
  brass: 6.4,
  stainless: 2.1,
  lead: 2.6,
  "insulated-copper-wire": 4.3,
};

// Deterministic (no Math.random) so server and client render the same
// initial values on first paint — live ticking happens after mount instead.
function seededHistory(base: number, points: number): number[] {
  let value = base;
  const history: number[] = [];
  for (let i = 0; i < points; i++) {
    const drift = Math.sin(i / 3 + base) * 0.015 * base;
    value = Math.max(base * 0.7, value + drift);
    history.push(Number(value.toFixed(3)));
  }
  return history;
}

export function initialPrices(): MetalPrice[] {
  return (Object.keys(BASE_PRICES) as MetalId[]).map((metal) => {
    const history = seededHistory(BASE_PRICES[metal], 24);
    const first = history[0];
    const last = history[history.length - 1];
    return {
      metal,
      pricePerKg: last,
      changePct24h: Number((((last - first) / first) * 100).toFixed(2)),
      history,
    };
  });
}

export function tickPrices(prices: MetalPrice[]): MetalPrice[] {
  return prices.map((p) => {
    const drift = (Math.random() - 0.5) * 0.01 * p.pricePerKg;
    const next = Math.max(0.05, Number((p.pricePerKg + drift).toFixed(3)));
    const history = [...p.history.slice(-23), next];
    const first = history[0];
    return {
      ...p,
      pricePerKg: next,
      changePct24h: Number((((next - first) / first) * 100).toFixed(2)),
      history,
    };
  });
}

export const YARDS: Yard[] = [
  {
    id: "yard-1",
    name: "Southside Metal Recyclers",
    suburb: "Onehunga",
    distanceKm: 2.4,
    buyPrices: {
      copper: 10.9,
      aluminium: 1.75,
      steel: 0.3,
      brass: 6.1,
      stainless: 2.0,
    },
  },
  {
    id: "yard-2",
    name: "Northbridge Scrap & Salvage",
    suburb: "Albany",
    distanceKm: 5.1,
    buyPrices: {
      copper: 11.05,
      aluminium: 1.8,
      steel: 0.31,
      brass: 6.3,
      lead: 2.5,
    },
  },
  {
    id: "yard-3",
    name: "Ironwood Recycling Yard",
    suburb: "Penrose",
    distanceKm: 3.8,
    buyPrices: {
      copper: 11.15,
      aluminium: 1.82,
      steel: 0.32,
      stainless: 2.05,
      "insulated-copper-wire": 4.1,
    },
  },
];
