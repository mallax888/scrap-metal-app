import { Metal, MetalId } from "./types";

// Real-world, earthy metal tones — used for swatches, chart lines, and bold
// metal-name labels throughout the app.
export const METALS: Metal[] = [
  { id: "copper", label: "Copper", unit: "kg", color: "#d4763f" },
  { id: "aluminium", label: "Aluminium", unit: "kg", color: "#c9c3b4" },
  { id: "steel", label: "Steel", unit: "kg", color: "#a89e8c" },
  { id: "brass", label: "Brass", unit: "kg", color: "#d9ac4a" },
  { id: "stainless", label: "Stainless Steel", unit: "kg", color: "#e2ddd0" },
  { id: "lead", label: "Lead", unit: "kg", color: "#8f8879" },
  {
    id: "insulated-copper-wire",
    label: "Insulated Copper Wire",
    unit: "kg",
    color: "#b3722f",
  },
];

export function getMetal(id: MetalId): Metal {
  const metal = METALS.find((m) => m.id === id);
  if (!metal) throw new Error(`Unknown metal: ${id}`);
  return metal;
}
