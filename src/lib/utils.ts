import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Every price in the product is in Indian rupees. Going through one formatter
 * keeps the symbol and the digit grouping (₹1,23,456.00 — lakhs, not
 * thousands) consistent everywhere instead of hand-built `$${n.toFixed(2)}`
 * templates drifting apart across pages.
 */
const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

/** Whole rupees — for stat tiles where the paise are noise. */
const rupeeWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

export function formatPrice(value: unknown, { whole = false } = {}): string {
  const n = typeof value === "number" ? value : Number(value)
  const safe = Number.isFinite(n) ? n : 0
  return whole ? rupeeWholeFormatter.format(safe) : rupeeFormatter.format(safe)
}

/**
 * Order seat-row labels the way a venue does: A…Z, then AA, AB…
 * A plain string sort files "AA" between "A" and "B", which scrambles the
 * seat map on any layout with more than 26 rows.
 */
export function compareRows(a: string, b: string) {
  return a.length - b.length || a.localeCompare(b)
}
