"""
Vastraliya Tracking System integration.

Call `sync_order_to_tracking(...)` right after an order is confirmed / paid
on the website. It pushes the order into the tracking system
(tracking-api.vastraliya.com) so it gets a tracking number and shows up on
tracking.vastraliya.com automatically.

Requires: pip install requests

Set these as environment variables on the vastraliya.com server (do not
hardcode them in source control):
    TRACKING_API_BASE_URL=https://tracking-api.vastraliya.com/api/v1
    TRACKING_API_EMAIL=<an admin/staff login email for the tracking system>
    TRACKING_API_PASSWORD=<that account's password>
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

import requests

BASE_URL = os.environ.get("TRACKING_API_BASE_URL", "https://tracking-api.vastraliya.com/api/v1")

_TIMEOUT = 15  # seconds


class TrackingApiError(RuntimeError):
    """Raised when the tracking API rejects a request."""


def is_tracking_configured() -> bool:
    """True once TRACKING_API_EMAIL / TRACKING_API_PASSWORD are set in .env."""
    return bool(os.environ.get("TRACKING_API_EMAIL") and os.environ.get("TRACKING_API_PASSWORD"))


def _credentials() -> tuple[str, str]:
    # Read lazily, at call time: a hard os.environ[...] at import time would
    # crash the whole backend on startup on any server where the tracking
    # credentials aren't configured yet.
    email = os.environ.get("TRACKING_API_EMAIL")
    password = os.environ.get("TRACKING_API_PASSWORD")
    if not email or not password:
        raise TrackingApiError(
            "Tracking system credentials missing — set TRACKING_API_EMAIL and "
            "TRACKING_API_PASSWORD in the backend .env to enable order tracking sync."
        )
    return email, password


@dataclass
class _TokenCache:
    access_token: str | None = None
    expires_at: float = 0.0


_token_cache = _TokenCache()


def _request(method: str, path: str, *, auth: bool = True, **kwargs) -> dict:
    headers = kwargs.pop("headers", {})
    if auth:
        headers["Authorization"] = f"Bearer {_get_access_token()}"
    response = requests.request(method, f"{BASE_URL}{path}", headers=headers, timeout=_TIMEOUT, **kwargs)
    if response.status_code >= 400:
        raise TrackingApiError(f"{method} {path} failed ({response.status_code}): {response.text}")
    return response.json()


def _get_access_token() -> str:
    # Reuse the token until ~1 minute before it's likely to expire, instead
    # of logging in again on every call.
    if _token_cache.access_token and time.time() < _token_cache.expires_at:
        return _token_cache.access_token

    email, password = _credentials()
    data = _request(
        "POST",
        "/auth/login",
        auth=False,
        json={"email": email, "password": password},
    )
    _token_cache.access_token = data["access_token"]
    _token_cache.expires_at = time.time() + 25 * 60  # refresh well before a typical 30-60 min JWT expiry
    return _token_cache.access_token


def find_or_create_customer(name: str, email: str, phone: str | None = None) -> int:
    """Returns the tracking-system customer id for this email, creating one if needed."""
    existing = _request("GET", "/customers", params={"search": email, "page_size": 1})
    for item in existing.get("items", []):
        if item["email"].lower() == email.lower():
            return item["id"]

    created = _request("POST", "/customers", json={"name": name, "email": email, "phone": phone})
    return created["id"]


def find_or_create_product(sku: str, name: str, price: float, weight: float | None = None) -> int:
    """Returns the tracking-system product id for this SKU, creating it on first use."""
    existing = _request("GET", "/products", params={"search": sku, "page_size": 1})
    for item in existing.get("items", []):
        if item["sku"] == sku:
            return item["id"]

    created = _request("POST", "/products", json={"sku": sku, "name": name, "price": price, "weight": weight})
    return created["id"]


def create_order(customer_id: int, items: list[dict]) -> dict:
    """items: [{"product_id": 1, "quantity": 2}, ...]"""
    return _request("POST", "/orders", json={"customer_id": customer_id, "items": items})


def create_shipment(
    order_id: int,
    origin: str | None = None,
    destination: str | None = None,
    warehouse_id: int | None = None,
) -> dict:
    """Returns the shipment, including the auto-generated tracking_number."""
    return _request(
        "POST",
        "/shipments",
        json={
            "order_id": order_id,
            "origin": origin,
            "destination": destination,
            "warehouse_id": warehouse_id,
        },
    )


def sync_order_to_tracking(
    *,
    customer_name: str,
    customer_email: str,
    customer_phone: str | None,
    line_items: list[dict],
    origin: str | None = None,
    destination: str | None = None,
) -> str:
    """
    High-level entry point: call this once, right after checkout succeeds.

    line_items: [{"sku": "SAREE-RED-01", "name": "Red Silk Saree", "price": 2500.0,
                   "weight": 0.5, "quantity": 1}, ...]

    Returns the tracking_number to show/email to the customer.
    """
    customer_id = find_or_create_customer(customer_name, customer_email, customer_phone)

    order_items = []
    for line in line_items:
        product_id = find_or_create_product(line["sku"], line["name"], line["price"], line.get("weight"))
        order_items.append({"product_id": product_id, "quantity": line["quantity"]})

    order = create_order(customer_id, order_items)
    shipment = create_shipment(order["id"], origin=origin, destination=destination)
    return shipment["tracking_number"]


if __name__ == "__main__":
    # Example - wire this call into your real checkout/order-confirmation code.
    tracking_number = sync_order_to_tracking(
        customer_name="Priya Sharma",
        customer_email="priya@example.com",
        customer_phone="9800000000",
        line_items=[
            {"sku": "SAREE-RED-01", "name": "Red Silk Saree", "price": 2500.0, "weight": 0.5, "quantity": 1},
        ],
        origin="Mumbai Warehouse",
        destination="Priya's shipping address, Pune",
    )
    print("Tracking number:", tracking_number)
