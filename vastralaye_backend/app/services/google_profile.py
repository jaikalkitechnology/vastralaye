"""Turn a Google People API payload into Vastralaye user fields.

Pure functions, no HTTP and no ORM, so the mapping can be exercised on its
own — which matters because Google's shapes vary a lot between accounts.
"""

from typing import Optional

# Sensitive scopes: Google caps an unverified app at 100 users and shows a
# warning on the consent screen until the app is verified.
PROFILE_SCOPES = (
    "https://www.googleapis.com/auth/user.addresses.read "
    "https://www.googleapis.com/auth/user.phonenumbers.read"
)

PROFILE_FIELDS = (
    "phone",
    "address_line1",
    "address_line2",
    "city",
    "region",
    "postal_code",
    "country",
)


def pick_entry(entries: list, preferred_type: str) -> dict:
    """Google returns a list; take the preferred type, else primary, else first."""
    if not entries:
        return {}
    for entry in entries:
        if (entry.get("type") or "").lower() == preferred_type:
            return entry
    for entry in entries:
        if (entry.get("metadata") or {}).get("primary"):
            return entry
    return entries[0]


def profile_fields(data: dict) -> dict:
    """People API payload → {user column: value}, empty values dropped."""
    address = pick_entry(data.get("addresses") or [], "home")
    phone = pick_entry(data.get("phoneNumbers") or [], "mobile")

    fields = {
        "phone": (phone.get("canonicalForm") or phone.get("value") or "").strip(),
        "address_line1": (address.get("streetAddress") or "").strip(),
        "address_line2": (address.get("extendedAddress") or "").strip(),
        "city": (address.get("city") or "").strip(),
        "region": (address.get("region") or "").strip(),
        "postal_code": (address.get("postalCode") or "").strip(),
        "country": (address.get("country") or "").strip(),
    }

    # Google's addresses are frequently unstructured — one formatted blob and
    # nothing else. Better a filled line 1 than an empty form.
    if not fields["address_line1"] and address.get("formattedValue"):
        fields["address_line1"] = address["formattedValue"].strip()

    return {k: v for k, v in fields.items() if v}


def fill_blanks(user, data: dict) -> list:
    """Write Google's values into empty fields only, and report what changed.

    Anything the customer has already entered wins: they typed it for a
    reason, and Google's copy is often stale.
    """
    filled = []
    for field, value in profile_fields(data).items():
        if not (getattr(user, field, None) or "").strip():
            setattr(user, field, value)
            filled.append(field)
    return filled
