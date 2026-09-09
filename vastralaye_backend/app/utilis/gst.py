"""Shared GST math for invoices, order APIs and emails.

Prices in this store are GST-inclusive, so tax is EXTRACTED from the
amount (line / (1 + rate/100)), never added on top. Each product carries
its own rates; the chain below mirrors the storefront cart exactly:
igst when set, else sgst+cgst, else the 18% fallback.

Place of supply follows the GST rule the cart uses: a Maharashtra buyer
(same state as the seller) sees the tax split into SGST + CGST halves,
anyone else sees IGST, and an unknown state gets a neutral "GST" head.
"""

DEFAULT_GST_RATE = 18.0


def _f(value) -> float:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0.0
    return n if n > 0 else 0.0


def gst_rate(source) -> float:
    """Per-product GST %. `source` is a Product row or a plain dict
    carrying igst/sgst/cgst keys (invoice item payloads)."""
    if source is None:
        return DEFAULT_GST_RATE
    get = source.get if isinstance(source, dict) else lambda k, d=None: getattr(source, k, d)
    igst = _f(get("igst"))
    if igst:
        return igst
    split = _f(get("sgst")) + _f(get("cgst"))
    if split:
        return split
    return DEFAULT_GST_RATE


def extract_tax(amount: float, rate: float):
    """Split a GST-inclusive amount into (taxable, tax), both 2dp."""
    amount = float(amount or 0)
    taxable = round(amount / (1 + rate / 100.0), 2)
    return taxable, round(amount - taxable, 2)


def items_gst_total(items) -> float:
    """Total GST inside a list of {price, quantity, igst/sgst/cgst} items."""
    total = 0.0
    for item in items:
        get = item.get if isinstance(item, dict) else lambda k, d=None: getattr(item, k, d)
        line = _f(get("price")) * (get("quantity") or get("qty") or 1)
        total += extract_tax(line, gst_rate(item))[1]
    return round(total, 2)


def uniform_rate(items):
    """The single GST % shared by every item, or None when rates differ."""
    rates = {gst_rate(i) for i in items} if items else set()
    return rates.pop() if len(rates) == 1 else None


def fmt_rate(rate: float) -> str:
    """5 -> '5', 2.5 -> '2.5' — no trailing zeros in head labels."""
    return f"{rate:g}"


def is_maharashtra(text) -> bool:
    return "maharashtra" in (text or "").lower()


def tax_heads(gst_amount: float, buyer_state_text, rate=None):
    """The summary rows for a given GST total: [(label, amount), ...].

    Maharashtra -> SGST + CGST halves; another state -> IGST; state
    unknown -> neutral GST. `rate` (the uniform %) decorates the labels
    when every item shares it.
    """
    gst_amount = round(float(gst_amount or 0), 2)
    text = (buyer_state_text or "").strip()
    if text and is_maharashtra(text):
        half_label = f" ({fmt_rate(rate / 2)}%)" if rate else ""
        # Same paisa split as the storefront cart: SGST carries the odd paisa.
        cgst = round(gst_amount / 2, 2)
        return [
            (f"SGST{half_label}", round(gst_amount - cgst, 2)),
            (f"CGST{half_label}", cgst),
        ]
    label = "IGST" if text else "GST"
    return [(f"{label} ({fmt_rate(rate)}%)" if rate else label, gst_amount)]
