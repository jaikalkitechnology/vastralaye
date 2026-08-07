# ======================================================================
#  This file acts as the public interface for all your CRUD functions.
#  We import specific functions from each file to make them available
#  to the rest of the application.
# ======================================================================

# --- Product CRUD functions ---
from .product import create_product, get_product

# --- Payment & Gateway CRUD functions (This part is correct) ---
from .payment_gateway import (
    create_or_update_payment_log,
    get_active_credential
)

# --- User CRUD functions ---
from .user import get_password_hash

# --- Category CRUD functions (THIS IS THE FIX) ---
# We are now importing the function name that actually exists: `get_categories`
from .category import (
    get_categories,
    create_category,
    get_category,
    update_category,
    delete_category
    # Add other functions from category.py here if you need them globally
)

# --- Coupon CRUD functions (Placeholder) ---
# from .coupon import ... (Uncomment when you build this)

# --- Order CRUD functions (Placeholder)---
# from .order import ... (Uncomment when you build this)