"""
Vastraliya Tracking System integration.

Drop this file into the vastraliya.com backend codebase and call
`sync_order_to_tracking(...)` right after an order is confirmed / paid on
the website, passing the customer's real shipping address from your own
checkout form data. It pushes the order (customer, address, products,
order, shipment) into the tracking system (tracking-api.vastraliya.com) so
it gets a tracking number and shows up on tracking.vastraliya.com
automatically - with the correct shipping address attached, not a blank
one that a staff member has to fill in by hand afterwards.

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
EMAIL = os.environ.get("TRACKING_API_EMAIL")
PASSWORD = os.environ.get("TRACKING_API_PASSWORD")

_TIMEOUT = 15  # seconds


class TrackingApiError(RuntimeError):
    """Raised when the tracking API rejects a request."""


def is_tracking_configured() -> bool:
    """Returns True if TRACKING_API_EMAIL and TRACKING_API_PASSWORD are set.

    Call this before sync_order_to_tracking(...) so a missing/misconfigured
    env var on a given server (e.g. staging) just skips the sync instead of
    raising.
    """
    return bool(EMAIL) and bool(PASSWORD)


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
    if not is_tracking_configured():
        raise TrackingApiError(
            "TRACKING_API_EMAIL / TRACKING_API_PASSWORD are not set - tracking sync is not configured on this server."
        )

    # Reuse the token until ~1 minute before it's likely to expire, instead
    # of logging in again on every call.
    if _token_cache.access_token and time.time() < _token_cache.expires_at:
        return _token_cache.access_token

    data = _request(
        "POST",
        "/auth/login",
        auth=False,
        json={"email": EMAIL, "password": PASSWORD},
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


def create_address(
    customer_id: int,
    *,
    address_line1: str,
    city: str,
    state: str,
    pincode: str,
    address_line2: str | None = None,
    country: str = "India",
) -> int:
    """Creates a new address for this customer and returns its id.

    Always creates a fresh address rather than searching for a matching one,
    since the tracking system doesn't have a "find existing address"
    endpoint - each order's shipping address is recorded as its own entry,
    the same way a real order history works.
    """
    created = _request(
        "POST",
        "/addresses",
        json={
            "customer_id": customer_id,
            "address_line1": address_line1,
            "address_line2": address_line2,
            "city": city,
            "state": state,
            "pincode": pincode,
            "country": country,
        },
    )
    return created["id"]


def find_or_create_product(
    sku: str,
    name: str,
    price: float,
    weight: float | None = None,
    image_url: str | None = None,
    category: str | None = None,
) -> int:
    """Returns the tracking-system product id for this SKU, creating it on first use.

    If the product already exists but is missing its image or category (or either
    has changed on vastraliya.com), this updates it in place so the tracking admin
    stays in sync with the product catalog shown on the website.
    """
    existing = _request("GET", "/products", params={"search": sku, "page_size": 1})
    for item in existing.get("items", []):
        if item["sku"] == sku:
            patch = {}
            if image_url and item.get("image_url") != image_url:
                patch["image_url"] = image_url
            if category and item.get("category") != category:
                patch["category"] = category
            if patch:
                _request("PUT", f"/products/{item['id']}", json=patch)
            return item["id"]

    created = _request(
        "POST",
        "/products",
        json={"sku": sku, "name": name, "price": price, "weight": weight, "image_url": image_url, "category": category},
    )
    return created["id"]


def create_order(
    customer_id: int,
    items: list[dict],
    *,
    shipping_address_id: int | None = None,
    billing_address_id: int | None = None,
    payment_method: str = "ONLINE",
) -> dict:
    """items: [{"product_id": 1, "quantity": 2}, ...]
    payment_method: "ONLINE" or "COD" - whatever the customer actually chose at your checkout.
    """
    return _request(
        "POST",
        "/orders",
        json={
            "customer_id": customer_id,
            "items": items,
            "shipping_address_id": shipping_address_id,
            "billing_address_id": billing_address_id,
            "payment_method": payment_method,
        },
    )


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


def get_shipment_by_tracking_number(tracking_number: str) -> dict:
    """
    Looks up a shipment's current status by tracking number, for your "tracking
    status refresh" job to call periodically (or whenever a customer checks their
    order) and update order["tracking_status"] on vastraliya.com with.

    Uses the tracking system's public tracking endpoint - no login required, so
    this works even if TRACKING_API_EMAIL/PASSWORD aren't set.

    Returns a dict:
        {
            "tracking_number": "TRK...",
            "status": "IN_TRANSIT",  # see the status list below
            "estimated_delivery": "2026-10-10" or None,
            "origin": "Mumbai" or None,
            "destination": "Thane, Maharashtra" or None,
            "events": [
                {"id": 1, "status": "ORDER_CONFIRMED", "title": "Order Confirmed",
                 "description": "...", "location": "...", "event_time": "2026-10-03T12:07:09"},
                ...
            ],
        }

    "status" is one of: ORDER_CONFIRMED, PACKED, READY_FOR_PICKUP, PICKED_UP,
    IN_TRANSIT, ARRIVED_AT_HUB, OUT_FOR_DELIVERY, DELIVERED, DELIVERY_FAILED,
    CANCELLED, RETURN_REQUESTED, RETURNED, RTO, ON_HOLD.

    Raises TrackingApiError (404) if the tracking number doesn't exist.
    """
    return _request("GET", f"/track/{tracking_number}", auth=False)


def sync_order_to_tracking(
    *,
    customer_name: str,
    customer_email: str,
    customer_phone: str | None,
    line_items: list[dict],
    shipping_address: dict,
    billing_address: dict | None = None,
    payment_method: str = "ONLINE",
    origin: str | None = None,
) -> str:
    """
    High-level entry point: call this once, right after checkout succeeds,
    using the real address the customer entered at checkout - not a
    placeholder. No one has to type it in by hand afterwards.

    line_items: [{"sku": "SAREE-RED-01", "name": "Red Silk Saree", "price": 2500.0,
                   "weight": 0.5, "quantity": 1, "image_url": "https://vastraliya.com/images/saree-red-01.jpg",
                   "category": "Sarees"}, ...]
    "image_url" and "category" are optional per line item - pass the same product
    photo URL and category used on vastraliya.com so the tracking admin's Products
    and Inventory pages show them too (the Category column and filter dropdown stay
    empty for any product this isn't set for).

    shipping_address / billing_address: {"address_line1": "...", "address_line2": "...",
                   "city": "...", "state": "...", "pincode": "...", "country": "India"}
    billing_address defaults to the same as shipping_address if omitted.

    payment_method: "ONLINE" or "COD" - whichever the customer picked at checkout.

    Returns the tracking_number to show/email to the customer.
    """
    customer_id = find_or_create_customer(customer_name, customer_email, customer_phone)

    shipping_address_id = create_address(customer_id, **shipping_address)
    billing_address_id = (
        create_address(customer_id, **billing_address) if billing_address else shipping_address_id
    )

    order_items = []
    for line in line_items:
        product_id = find_or_create_product(
            line["sku"], line["name"], line["price"], line.get("weight"), line.get("image_url"), line.get("category")
        )
        order_items.append({"product_id": product_id, "quantity": line["quantity"]})

    order = create_order(
        customer_id,
        order_items,
        shipping_address_id=shipping_address_id,
        billing_address_id=billing_address_id,
        payment_method=payment_method,
    )

    destination = f"{shipping_address['city']}, {shipping_address['state']}"
    shipment = create_shipment(order["id"], origin=origin, destination=destination)
    return shipment["tracking_number"]


def sync_vastraliya_order(order: dict, *, website_base_url: str = "https://vastraliya.com") -> str:
    """
    Convenience wrapper built from the exact order shape you showed me - call this
    with your raw order dict (the one with "items", "customer_name", "phone_number",
    "shipping_address", "city", "state", "pincode", "payment_method", etc.) instead
    of sync_order_to_tracking(...) directly. It handles the field mapping for you:

      - Builds each product's sku as "VAS-P<product_id>" (matching what your orders
        already use).
      - Turns each item's relative product_image path (e.g.
        "/static/products/foo.jpg") into a full URL by prefixing website_base_url -
        change website_base_url if your images are served from a different domain
        or CDN.
      - Pulls the category name out of the nested product_category object
        (product_category["name"]), since the tracking system's category is a
        plain string, not an object.
      - Maps payment_method ("cod" / "online", any case) to the tracking system's
        "COD" / "ONLINE".

    Your sample order had no "customer_email" / "email" key, so if the order dict
    doesn't have one, this falls back to a synthetic email built from "user_id" so
    the same customer still dedupes correctly across orders
    ("vastraliya-user-<user_id>@vastraliya.local"). Once your checkout actually
    collects a real email, include it as order["customer_email"] (or ["email"])
    and this will use that instead - update this function if your real key is
    named something else.
    """
    email = order.get("customer_email") or order.get("email")
    if not email:
        user_id = order.get("user_id")
        if user_id is None:
            raise TrackingApiError("order has no customer_email/email and no user_id to fall back on")
        email = f"vastraliya-user-{user_id}@vastraliya.local"

    payment_method = "COD" if str(order.get("payment_method", "")).strip().lower() == "cod" else "ONLINE"

    line_items = [
        {
            "sku": f"VAS-P{item['product_id']}",
            "name": item["product_name"],
            "price": item["price"],
            "quantity": item["quantity"],
            "image_url": f"{website_base_url}{item['product_image']}" if item.get("product_image") else None,
            "category": item["product_category"]["name"] if item.get("product_category") else None,
        }
        for item in order["items"]
    ]

    shipping_address = {
        "address_line1": order["shipping_address"],
        "city": order["city"],
        "state": order["state"],
        "pincode": order["pincode"],
        "country": "India",
    }

    return sync_order_to_tracking(
        customer_name=order["customer_name"],
        customer_email=email,
        customer_phone=order.get("phone_number"),
        line_items=line_items,
        shipping_address=shipping_address,
        payment_method=payment_method,
    )


if __name__ == "__main__":
    # Example - wire this call into your real checkout/order-confirmation code,
    # using the address fields your checkout form actually collects.
    tracking_number = sync_order_to_tracking(
        customer_name="Priya Sharma",
        customer_email="priya@example.com",
        customer_phone="9800000000",
        line_items=[
            {
                "sku": "SAREE-RED-01",
                "name": "Red Silk Saree",
                "price": 2500.0,
                "weight": 0.5,
                "quantity": 1,
                "image_url": "https://vastraliya.com/images/saree-red-01.jpg",
                "category": "Sarees",
            },
        ],
        shipping_address={
            "address_line1": "12 MG Road",
            "address_line2": "Near City Mall",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "country": "India",
        },
        payment_method="COD",  # or "ONLINE" - use whatever the customer picked at checkout
        origin="Mumbai Warehouse",
    )
    print("Tracking number:", tracking_number)

    # --- Or, if you already have a raw order dict in this exact shape (from your
    # order API/DB - the one you showed me), skip building line_items/shipping_address
    # by hand and just call sync_vastraliya_order(order) instead:
    sample_order = {
        "id": 361,
        "user_id": 129,
        "customer_name": "vikas",
        "phone_number": "8748789787",
        "shipping_address": "sdfdsf, sdfsdfsdf, sdfsdfsd, India",
        "city": "sdfsdfsdf",
        "state": "sdfsdfsd",
        "pincode": "545446",
        "payment_method": "cod",
        "items": [
            {
                "product_id": 68,
                "quantity": 1,
                "price": 1500,
                "product_name": "Women Designer Anarkali Kurta Variant 19",
                "product_image": "/static/products/Women-Designer-Anarkali-Kurta-Variant-19-1.jpg",
                "product_category": {"name": "Ethnic"},
            },
        ],
    }
    tracking_number_2 = sync_vastraliya_order(sample_order)
    print("Tracking number:", tracking_number_2)