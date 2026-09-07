from app.data.orders import find_order


def test_find_order_returns_known_order():
    order = find_order("1001")
    assert order == {"status": "Shipped", "eta": "2 business days"}


def test_find_order_returns_none_for_unknown_id():
    assert find_order("9999") is None


def test_find_order_strips_whitespace():
    assert find_order("  1002  ") == {"status": "Processing", "eta": "4 business days"}
