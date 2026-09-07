/**
 * Discount labels that always survive a customer's own arithmetic.
 *
 * Selling prices here are kept round by design (₹3,000 → ₹2,900), so the
 * true percentage is often fractional (3.33%). Rounding it to "3% off"
 * prints a claim the two visible prices contradict — 3% off ₹3,000 would
 * be ₹2,910, not ₹2,900. So the rule is: quote the percentage only when
 * it is exactly a whole number, and otherwise quote the rupees saved,
 * which is always true to the paisa.
 */

const IN = (n: number) => n.toLocaleString('en-IN');

export interface DiscountInfo {
  /** Rupees saved (original − selling). */
  saved: number;
  /** Whole-number percent when mathematically exact, else null. */
  percent: number | null;
}

export const discountInfo = (
  price?: number | null,
  sellingPrice?: number | null
): DiscountInfo | null => {
  const p = Number(price);
  const s = Number(sellingPrice);
  if (!Number.isFinite(p) || !Number.isFinite(s) || p <= 0 || s < 0 || s >= p) return null;
  const saved = p - s;
  const pct = (saved / p) * 100;
  const rounded = Math.round(pct);
  // 0.05pp tolerance absorbs float error only, not real fractions.
  const exact = rounded > 0 && Math.abs(pct - rounded) < 0.05;
  return { saved, percent: exact ? rounded : null };
};

/** Inline label: "10% off" when exact, else "₹100 off". */
export const discountLabel = (
  price?: number | null,
  sellingPrice?: number | null
): string | null => {
  const d = discountInfo(price, sellingPrice);
  if (!d) return null;
  return d.percent !== null ? `${d.percent}% off` : `₹${IN(d.saved)} off`;
};

/** Corner-badge label: "-10%" when exact, else "-₹100". */
export const discountBadgeText = (
  price?: number | null,
  sellingPrice?: number | null
): string | null => {
  const d = discountInfo(price, sellingPrice);
  if (!d) return null;
  return d.percent !== null ? `-${d.percent}%` : `-₹${IN(d.saved)}`;
};
