export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatPricePerKg(value: number): string {
  return `${formatMoney(value)}/kg`;
}
