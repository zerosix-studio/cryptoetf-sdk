"""Response shapes of the CryptoETF public API v1 (https://docs.cryptoetf.today).

Flow values are net US$ millions, rounded to one decimal: positive = inflow,
negative = outflow. Dates are ``YYYY-MM-DD`` (UTC trading days), timestamps ISO 8601.
Responses are plain dicts; these TypedDicts only describe them for type checkers.
"""

from __future__ import annotations

from typing import List, Literal, Optional, TypedDict


class FlowsSummaryItem(TypedDict):
    symbol: str
    asset: str
    date: Optional[str]
    netFlowUsdM: float


class FlowsSummary(TypedDict):
    assets: List[FlowsSummaryItem]
    updatedAt: str


class FlowPoint(TypedDict):
    date: str
    netFlowUsdM: float


class AssetFlows(TypedDict):
    symbol: str
    asset: str
    windowDays: int
    days: List[FlowPoint]
    updatedAt: str


class FundFlow(TypedDict):
    ticker: str
    issuer: str
    netFlowUsdM: Optional[float]


class FundDay(TypedDict):
    date: str
    totalUsdM: float
    funds: List[FundFlow]


class AssetFundFlows(TypedDict):
    symbol: str
    asset: str
    windowDays: int
    days: List[FundDay]
    updatedAt: str


class AssetNetAssets(TypedDict):
    symbol: str
    asset: str
    totalNetAssetsUsdM: Optional[float]
    date: Optional[str]


class Fund(TypedDict):
    ticker: str
    name: str
    issuer: str
    symbol: str
    asset: str
    exchange: str
    listedAt: str
    sponsorFeePct: Optional[float]
    netAssetsUsdM: Optional[float]
    coinsHeld: Optional[float]
    coinsHeldDate: Optional[str]
    netAssetsDate: Optional[str]
    netAssetsBasis: Optional[Literal["reported", "repriced", "estimated"]]


class Funds(TypedDict):
    assets: List[AssetNetAssets]
    funds: List[Fund]
    updatedAt: str


class CefiComponents(TypedDict):
    flow: float
    trend: float
    breadth: float


class IndexPoint(TypedDict):
    date: str
    value: float


class CefiIndex(TypedDict):
    index: str
    current: float
    components: Optional[CefiComponents]
    date: str
    windowDays: int
    history: List[IndexPoint]


class Ticker(TypedDict):
    symbol: str
    asset: str
    name: str


class Price(TypedDict):
    symbol: str
    priceUsd: float
    change24hPct: float


class Prices(TypedDict):
    prices: List[Price]
    updatedAt: str


class WeeklyAsset(TypedDict):
    symbol: str
    asset: str
    netFlowUsdM: float
    avgDailyUsdM: float
    positiveDays: int
    negativeDays: int


# "from" is a Python keyword, so this one needs the functional TypedDict form.
WeeklyAnalytics = TypedDict(
    "WeeklyAnalytics",
    {"from": str, "to": str, "assets": List[WeeklyAsset]},
)


class RateLimit(TypedDict):
    limit: int
    remaining: int
    reset: int
