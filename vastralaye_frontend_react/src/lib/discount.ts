/**
 * Discount labels that always survive a customer's own arithmetic.
 *
 * Selling prices here are kept round by design (₹3,000 → ₹2,900), so the
 * true percentage is often fractional. Rounding it to "3% off" prints a
 * claim the two visible prices contradict — 3% off ₹3,000 would be
 * ₹2,910, not ₹2,900. The label is always a percentage (the shop's
 * preference), quoted exactly: whole when it is whole ("10% off"),
 * otherwise with just enough decimals to be true ("3.33% off").
 */

/** "10", "3.33", "5.26", "12.5" — whole numbers stay whole. */
const formatPct = (pct: number): string => {
  const rounded = Math.round(pct);
  // 0.05pp tolerance absorbs float error only, not real fractions.
  if (Math.abs(pct - rounded) < 0.05) return String(rounded);
  return pct.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

const truePercent = (
  price?: number | null,
  sellingPrice?: number | null
): number | null => {
  const p = Number(price);
  const s = Number(sellingPrice);
  if (!Number.isFinite(p) || !Number.isFinite(s) || p <= 0 || s < 0 || s >= p) return null;
  return ((p - s) / p) * 100;
};

/** Inline label: "10% off" / "3.33% off". */
export const discountLabel = (
  price?: number | null,
  sellingPrice?: number | null
): string | null => {
  const pct = truePercent(price, sellingPrice);
  return pct === null ? null : `${formatPct(pct)}% off`;
};

/** Corner-badge label: "-10%" / "-3.33%". */
export const discountBadgeText = (
  price?: number | null,
  sellingPrice?: number | null
): string | null => {
  const pct = truePercent(price, sellingPrice);
  return pct === null ? null : `-${formatPct(pct)}%`;
};
