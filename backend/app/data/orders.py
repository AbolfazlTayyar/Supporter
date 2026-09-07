"""
Data access for order records. This is a mock in-memory "database" - swap in
a real database/API call later if you want, keeping the same function signature.
"""

_FAKE_ORDERS = {
    "1001": {"status": "Shipped", "eta": "2 business days"},
    "1002": {"status": "Processing", "eta": "4 business days"},
    "1003": {"status": "Delivered", "eta": "already delivered"},
}


def find_order(order_id: str) -> dict | None:
    """Looks up an order by ID, returning its record or None if it doesn't exist."""
    return _FAKE_ORDERS.get(order_id.strip())
