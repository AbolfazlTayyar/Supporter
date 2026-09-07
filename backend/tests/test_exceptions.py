from app.exceptions import AppError, UpstreamServiceError


def test_app_error_uses_default_message_and_status_code():
    error = AppError()
    assert error.status_code == 500
    assert error.message == "Something went wrong."
    assert str(error) == "Something went wrong."


def test_app_error_accepts_custom_message():
    error = AppError("custom message")
    assert error.message == "custom message"


def test_upstream_service_error_has_502_status_and_client_safe_message():
    error = UpstreamServiceError()
    assert error.status_code == 502
    assert "temporarily unavailable" in error.message
