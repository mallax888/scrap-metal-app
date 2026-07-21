import { Metal, MetalId } from "./types";

export const METALS: Metal[] = [
  { id: "copper", label: "Copper", unit: "kg", swatch: "bg-orange-500" },
  { id: "aluminium", label: "Aluminium", unit: "kg", swatch: "bg-slate-400" },
  { id: "steel", label: "Steel", unit: "kg", swatch: "bg-zinc-500" },
  { id: "brass", label: "Brass", unit: "kg", swatch: "bg-yellow-500" },
  { id: "stainless", label: "Stainless Steel", unit: "kg", swatch: "bg-slate-300" },
  { id: "lead", label: "Lead", unit: "kg", swatch: "bg-slate-600" },
  {
    id: "insulated-copper-wire",
    label: "Insulated Copper Wire",
    unit: "kg",
    swatch: "bg-amber-600",
  },
];

export function getMetal(id: MetalId): Metal {
  const metal = METALS.find((m) => m.id === id);
  if (!metal) throw new Error(`Unknown metal: ${id}`);
  return metal;
}
