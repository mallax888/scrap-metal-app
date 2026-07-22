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

// Real, independently-verified NZ scrap metal dealers (name/suburb/region/phone
// only — sourced via web search, not partners of this app). Deliberately carry
// no buyPrices: we cannot fabricate or display a live rate for a business that
// hasn't provided one. The Sell flow falls back to the market price for these.
export const YARDS: Yard[] = [
  // Northland
  { id: "marsden-metals-ruakaka", name: "Marsden Metals", suburb: "Ruakaka", region: "Northland", phone: "0800 336 673" },
  { id: "kamo-scrap-metals-whangarei", name: "Kamo Scrap Metals Ltd", suburb: "Whangarei", region: "Northland", phone: "(09) 435 2488" },
  { id: "phoenix-recycling-whangarei", name: "Phoenix Recycling Whangarei", suburb: "Whangarei", region: "Northland" },

  // Auckland
  { id: "mccamish-metals-auckland", name: "McCamish Metals", suburb: "Auckland", region: "Auckland", phone: "09 636 8628" },
  { id: "endless-metals-onehunga", name: "Endless Metals", suburb: "Onehunga", region: "Auckland" },
  { id: "metal-exchange-albany", name: "Metal Exchange", suburb: "Albany", region: "Auckland" },
  { id: "sky-metal-recyclers-papatoetoe", name: "Sky Metal Recyclers", suburb: "Papatoetoe", region: "Auckland" },

  // Waikato
  { id: "sims-metal-hamilton", name: "Sims Metal", suburb: "Hamilton", region: "Waikato" },
  { id: "metallic-recycling-hamilton", name: "Metallic Recycling Ltd", suburb: "Hamilton", region: "Waikato" },
  { id: "central-metals-hamilton", name: "Central Metals Limited", suburb: "Hamilton", region: "Waikato" },
  { id: "metalco-recyclers-hamilton", name: "Metalco Recyclers", suburb: "Hamilton", region: "Waikato" },

  // Bay of Plenty
  { id: "scrapman-bop-greerton", name: "Scrapman Bay of Plenty", suburb: "Greerton, Tauranga", region: "Bay of Plenty", phone: "07 541 0900" },
  { id: "metalco-recyclers-tauranga", name: "Metalco Recyclers", suburb: "Tauranga / Te Puke", region: "Bay of Plenty" },

  // Hawke's Bay
  { id: "harris-scrap-metal-hastings", name: "Harris Scrap Metal Ltd", suburb: "Hastings & Napier", region: "Hawke's Bay", phone: "(06) 873 3570" },
  { id: "hawkes-bay-scrap-metal-hastings", name: "Hawkes Bay Scrap Metal", suburb: "Hastings", region: "Hawke's Bay", phone: "+64 6-879 7724" },
  { id: "sims-metal-napier", name: "Sims Metal", suburb: "Napier", region: "Hawke's Bay", phone: "06 843 7434" },

  // Taranaki
  { id: "molten-metals-new-plymouth", name: "Molten Metals", suburb: "New Plymouth", region: "Taranaki", phone: "06 751 5367" },
  { id: "energy-city-recyclers-new-plymouth", name: "Energy City Recyclers", suburb: "New Plymouth", region: "Taranaki" },

  // Manawatū-Whanganui
  { id: "macaulay-metals-palmerston-north", name: "Macaulay Metals", suburb: "Palmerston North", region: "Manawatū-Whanganui", phone: "06 357 7071" },
  { id: "wrightmetals-palmerston-north", name: "Wrightmetals", suburb: "Palmerston North", region: "Manawatū-Whanganui", phone: "0800 472 727" },
  { id: "molten-metals-wanganui", name: "Molten Metals", suburb: "Whanganui", region: "Manawatū-Whanganui", phone: "06 349 0476" },

  // Wellington
  { id: "wellington-scrap-metals", name: "Wellington Scrap Metals", suburb: "Wellington", region: "Wellington", phone: "04 473 9277" },
  { id: "sims-metal-seaview", name: "Sims Metal", suburb: "Seaview, Lower Hutt", region: "Wellington", phone: "04 568 4342" },
  { id: "upper-hutt-metals-trentham", name: "Upper Hutt Metals", suburb: "Trentham, Upper Hutt", region: "Wellington" },

  // Nelson-Tasman / Marlborough
  { id: "sims-metal-nelson", name: "Sims Metal", suburb: "Annesbrook, Nelson", region: "Nelson-Tasman", phone: "03 548 6766" },
  { id: "nelson-metal-industries", name: "Nelson Metal Industries", suburb: "Nelson", region: "Nelson-Tasman" },
  { id: "marlborough-metal-recycling-blenheim", name: "Marlborough Metal Recycling", suburb: "Blenheim", region: "Marlborough" },
  { id: "blenheim-metal-recyclers", name: "Blenheim Metal Recyclers", suburb: "Blenheim", region: "Marlborough" },

  // West Coast
  { id: "south-island-metal-exchange-greymouth", name: "South Island Metal Exchange", suburb: "Greymouth", region: "West Coast", phone: "(03) 768 0108" },

  // Canterbury
  { id: "metalcorp-nz-hornby", name: "Metalcorp NZ Ltd", suburb: "Hornby, Christchurch", region: "Canterbury", phone: "0800 73 55 72" },
  { id: "sims-metal-christchurch", name: "Sims Metal", suburb: "Christchurch", region: "Canterbury" },
  { id: "resource-recycling-woolston", name: "Resource Recycling", suburb: "Woolston, Christchurch", region: "Canterbury" },
  { id: "bristol-metals-christchurch", name: "Bristol Metals", suburb: "Christchurch", region: "Canterbury" },

  // Otago
  { id: "sims-metal-dunedin", name: "Sims Metal", suburb: "Dunedin", region: "Otago", phone: "03 477 0427" },
  { id: "phoenix-recycling-dunedin", name: "Phoenix Recycling Dunedin", suburb: "Green Island, Dunedin", region: "Otago" },

  // Southland
  { id: "sims-metal-invercargill", name: "Sims Metal", suburb: "Invercargill", region: "Southland", phone: "0800 226 626" },
  { id: "phoenix-recycling-invercargill", name: "Phoenix Recycling Invercargill", suburb: "Invercargill", region: "Southland" },
  { id: "invercargill-scrap-metals-waikiwi", name: "Invercargill Scrap Metals", suburb: "Waikiwi, Invercargill", region: "Southland" },
];

// Fictional sandbox yards for the Dealer Dashboard demo only — the only yards
// with editable buyPrices, so no real, unaffiliated business can ever have a
// fabricated rate attached to its name.
export const DEMO_YARDS: Yard[] = [
  {
    id: "demo-yard-1",
    name: "Demo Yard — Southside (sandbox)",
    suburb: "Onehunga",
    region: "Auckland",
    isDemo: true,
    buyPrices: {
      copper: 10.9,
      aluminium: 1.75,
      steel: 0.3,
      brass: 6.1,
      stainless: 2.0,
    },
  },
  {
    id: "demo-yard-2",
    name: "Demo Yard — Northbridge (sandbox)",
    suburb: "Albany",
    region: "Auckland",
    isDemo: true,
    buyPrices: {
      copper: 11.05,
      aluminium: 1.8,
      steel: 0.31,
      brass: 6.3,
      lead: 2.5,
    },
  },
  {
    id: "demo-yard-3",
    name: "Demo Yard — Ironwood (sandbox)",
    suburb: "Penrose",
    region: "Auckland",
    isDemo: true,
    buyPrices: {
      copper: 11.15,
      aluminium: 1.82,
      steel: 0.32,
      stainless: 2.05,
      "insulated-copper-wire": 4.1,
    },
  },
];
