"""Client for the CryptoETF public API v1."""

from __future__ import annotations

import json
import os
import socket
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Dict, List, Optional, cast

from . import __version__
from .types import (
    AssetFlows,
    AssetFundFlows,
    CefiIndex,
    FlowsSummary,
    Funds,
    Prices,
    RateLimit,
    Ticker,
    WeeklyAnalytics,
)

DEFAULT_BASE_URL = "https://api.cryptoetf.today/api/v1"
KEY_HELP = (
    "API key required. Get a free key at https://cryptoetf.today/en/profile "
    "and pass CryptoETF(api_key=...) or set CRYPTOETF_API_KEY."
)

# (url, headers, timeout) -> (status, headers, body). Swappable for tests and proxies.
Transport = Callable[[str, Dict[str, str], float], "tuple[int, Dict[str, str], bytes]"]


class CryptoETFError(Exception):
    """Error returned by the API (4xx/5xx) or raised by the client (timeout, network).

    ``status`` is 0 for network errors and timeouts. ``code`` is a machine-readable
    code when the API sends one (e.g. ``api_key_suspended``). ``retry_after`` is the
    number of seconds to wait on HTTP 429.
    """

    def __init__(self, message: str, status: int, code: Optional[str] = None, retry_after: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.retry_after = retry_after


def _urllib_transport(url: str, headers: Dict[str, str], timeout: float) -> "tuple[int, Dict[str, str], bytes]":
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, {k.lower(): v for k, v in res.headers.items()}, res.read()
    except urllib.error.HTTPError as err:
        with err:
            return err.code, {k.lower(): v for k, v in err.headers.items()}, err.read()
    except (socket.timeout, TimeoutError):
        raise CryptoETFError(f"Request timed out after {timeout} s", 0) from None
    except urllib.error.URLError as err:
        raise CryptoETFError(f"Network error: {err.reason}", 0) from None


class _Flows:
    def __init__(self, client: "CryptoETF"):
        self._c = client

    def summary(self) -> FlowsSummary:
        """Latest daily net flow for every asset."""
        return cast(FlowsSummary, self._c._get("/flows/summary"))

    def asset(self, asset: str) -> AssetFlows:
        """Daily net flows of one asset over the history window (30 days on the free tier)."""
        return cast(AssetFlows, self._c._get(f"/flows/{urllib.parse.quote(asset, safe='')}"))

    def funds(self, asset: str) -> AssetFundFlows:
        """Daily net flows of one asset, fund by fund."""
        return cast(AssetFundFlows, self._c._get(f"/flows/{urllib.parse.quote(asset, safe='')}/funds"))


class CryptoETF:
    """Daily net flows of US spot crypto ETFs for 16 assets, fund by fund, plus
    fund AUM, the CEFI sentiment index and coin prices.

    >>> etf = CryptoETF(api_key="...")
    >>> etf.flows.summary()["assets"][0]["symbol"]
    'BTC'

    ``asset`` arguments take a code (``btc``, ``eth``, ``sol``, ``hype``…) or a full
    name (``bitcoin``). Values are net US$ millions: positive = inflow.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 15.0,
        transport: Optional[Transport] = None,
    ):
        key = api_key or os.environ.get("CRYPTOETF_API_KEY")
        if not key:
            raise CryptoETFError(KEY_HELP, 401)
        self._key = key
        self._base = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport or _urllib_transport
        #: Rate-limit headers of the most recent response, or None before the first call.
        self.rate_limit: Optional[RateLimit] = None
        #: Daily net flows: ``summary()``, ``asset(asset)``, ``funds(asset)``.
        self.flows = _Flows(self)

    def funds(self, asset: Optional[str] = None) -> Funds:
        """Fund directory with assets under management; all 16 assets unless ``asset`` is given."""
        return cast(Funds, self._get("/funds", {"asset": asset} if asset else None))

    def cefi(self) -> CefiIndex:
        """CEFI — Crypto ETF Flow Index, a 0–100 sentiment gauge, with its recent history."""
        return cast(CefiIndex, self._get("/index/cefi"))

    def tickers(self) -> List[Ticker]:
        """Assets the API tracks."""
        return cast(List[Ticker], self._get("/tickers"))

    def prices(self) -> Prices:
        """Spot prices of the 16 coins."""
        return cast(Prices, self._get("/prices"))

    def weekly(self) -> WeeklyAnalytics:
        """Seven-day flow totals per asset."""
        return cast(WeeklyAnalytics, self._get("/analytics/weekly"))

    def _get(self, path: str, query: Optional[Dict[str, str]] = None) -> Any:
        url = self._base + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        headers = {
            "Authorization": f"Bearer {self._key}",
            "Accept": "application/json",
            "User-Agent": f"cryptoetf-python/{__version__}",
        }
        status, res_headers, raw = self._transport(url, headers, self._timeout)

        if res_headers.get("x-ratelimit-limit"):
            self.rate_limit = {
                "limit": int(res_headers["x-ratelimit-limit"]),
                "remaining": int(res_headers.get("x-ratelimit-remaining", 0)),
                "reset": int(res_headers.get("x-ratelimit-reset", 0)),
            }

        try:
            body = json.loads(raw) if raw else None
        except ValueError:
            body = None

        if status >= 400:
            b = body if isinstance(body, dict) else {}
            msg = b.get("message")
            if isinstance(msg, list):
                msg = "; ".join(str(m) for m in msg)
            retry = res_headers.get("retry-after")
            raise CryptoETFError(
                msg if isinstance(msg, str) else f"HTTP {status}",
                status,
                b.get("code") if isinstance(b.get("code"), str) else None,
                int(retry) if retry and retry.isdigit() else None,
            )
        return body
