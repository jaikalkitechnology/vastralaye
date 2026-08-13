"""Shared helpers for product media fields.

`Product.images` is a hybrid property that already returns a list, but the
same column is read as a raw comma-separated string in places (Excel import,
some admin queries), and rows written before the property existed can hold
either shape. One normaliser keeps every caller honest.
"""

from typing import Any, List


def normalize_images(value: Any) -> List[str]:
    """Anything the images column might hold → a clean list of paths.

    Accepts the hybrid property's list, a raw comma-separated string, None,
    or a stray non-string entry, and never raises — a product with odd image
    data should render without its pictures, not 500 the whole response.
    """
    if not value:
        return []
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    if isinstance(value, (list, tuple)):
        return [
            str(part).strip()
            for part in value
            if part is not None and str(part).strip()
        ]
    return []
