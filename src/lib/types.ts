export type MetalId =
  | "copper"
  | "aluminium"
  | "steel"
  | "brass"
  | "stainless"
  | "lead"
  | "insulated-copper-wire";

export interface Metal {
  id: MetalId;
  label: string;
  unit: "kg";
  swatch: string; // tailwind bg class for the metal's accent chip
}

export interface MetalPrice {
  metal: MetalId;
  pricePerKg: number;
  changePct24h: number;
  history: number[]; // recent prices, oldest -> newest, for sparkline
}

export type RequestMethod = "pickup" | "dropoff";

export type RequestStatus = "quoted" | "scheduled" | "collected" | "paid";

export interface Yard {
  id: string;
  name: string;
  suburb: string;
  distanceKm: number;
  buyPrices: Partial<Record<MetalId, number>>;
}

export interface ScrapRequest {
  id: string;
  metal: MetalId;
  weightKg: number;
  quotedPricePerKg: number;
  quotedTotal: number;
  method: RequestMethod;
  yardId?: string;
  address?: string;
  status: RequestStatus;
  createdAt: string;
  note?: string;
}
