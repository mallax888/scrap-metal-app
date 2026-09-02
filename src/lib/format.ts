/**
 * Formatting helpers. Dates are handled as plain `YYYY-MM-DD` strings and
 * always rendered in UTC so a repayment never slips a day depending on where
 * the browser happens to be.
 */

const NZD = "en-NZ";

/** `$2,800` / `$53.85` — cents only shown when they carry information. */
export function money(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat(NZD, {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
}

/** Always two decimals — for tables and receipts where columns must line up. */
export function moneyExact(value: number): string {
  return new Intl.NumberFormat(NZD, {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function points(value: number): string {
  return new Intl.NumberFormat(NZD).format(value);
}

export function percent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

export function daysBetween(fromISO: string, toISOStr: string): number {
  return Math.round((toDate(toISOStr).getTime() - toDate(fromISO).getTime()) / 86_400_000);
}

function fmt(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(NZD, { ...options, timeZone: "UTC" }).format(toDate(iso));
}

/** `9 July 2027` */
export function formatDate(iso: string): string {
  return fmt(iso, { day: "numeric", month: "long", year: "numeric" });
}

/** `14 Jul 2027` */
export function formatDateShort(iso: string): string {
  return fmt(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** `Friday, 4 September` */
export function formatDayDate(iso: string): string {
  return fmt(iso, { weekday: "long", day: "numeric", month: "long" });
}

/** `Fri 4 Sep` */
export function formatDayShort(iso: string): string {
  return fmt(iso, { weekday: "short", day: "numeric", month: "short" });
}

/** `4 Sep` */
export function formatDayMonth(iso: string): string {
  return fmt(iso, { day: "numeric", month: "short" });
}

/** `Mar` / `March` from a `YYYY-MM` string. */
export function formatMonth(monthISO: string, style: "short" | "long" = "short"): string {
  return fmt(`${monthISO}-01`, { month: style });
}

/** `Jul 26` — compact axis label. */
export function formatMonthAxis(iso: string): string {
  return fmt(iso, { month: "short", year: "2-digit" });
}

/**
 * `Today` / `Yesterday` / `28 Aug` — the timeline reads like a feed, so the
 * two most recent days get a friendlier label.
 */
export function formatRelativeDay(iso: string, todayISO: string): string {
  const diff = daysBetween(iso, todayISO);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDayMonth(iso);
}
