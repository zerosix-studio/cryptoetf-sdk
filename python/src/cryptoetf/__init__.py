"""Official Python client for the CryptoETF API — daily net flows of US spot crypto ETFs."""

__version__ = "1.0.0"

from .client import DEFAULT_BASE_URL, CryptoETF, CryptoETFError  # noqa: E402

__all__ = ["CryptoETF", "CryptoETFError", "DEFAULT_BASE_URL", "__version__"]
