"""Response shapes of the CryptoETF public API v1 (https://docs.cryptoetf.today).

Flow values are net US$ millions, rounded to one decimal: positive = inflow,
negative = outflow. Dates are ``YYYY-MM-DD`` (UTC trading days), timestamps ISO 8601.
Responses are plain dicts; these TypedDicts only describe them for type checkers.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, TypedDict


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


# ─── Paid datasets (Builder plan and above) ─────────────────────────────────
# A free key gets a 403 with code ``plan_required`` on every method below.


class HoldingsFund(TypedDict):
    ticker: str
    name: str
    issuer: str
    coins: float
    #: ``reported`` (published by the issuer) or ``estimated`` (net assets ÷ coin price).
    coinsBasis: Literal["reported", "estimated"]
    #: Fraction (0–1) of the asset's ETF coins held by this fund.
    shareOfEtfCoins: float
    date: str


class HoldingsAsset(TypedDict):
    asset: str
    asOf: Optional[str]
    coins: float
    coinsReported: float
    coinsEstimated: float
    netAssetsUsd: Optional[float]
    circulatingSupply: Optional[float]
    supplyDate: Optional[str]
    #: Percent of circulating supply (4.7 = 4.7%).
    supplyPct: Optional[float]
    change7dCoins: Optional[float]
    change30dCoins: Optional[float]
    change7dPctPoints: Optional[float]
    funds: List[HoldingsFund]


class HoldingsHistoryPoint(TypedDict):
    date: str
    coins: float
    supplyPct: Optional[float]


class Holdings(TypedDict):
    assets: List[HoldingsAsset]
    history: Dict[str, List[HoldingsHistoryPoint]]
    method: str
    updatedAt: str


class CostBasisAsset(TypedDict):
    asset: str
    symbol: str
    qtyCoin: float
    costUsd: float
    avgEntryUsd: Optional[float]
    price: Optional[float]
    marketValueUsd: Optional[float]
    pnlUsd: Optional[float]
    #: Fraction: -0.072 means -7.2%.
    pnlPct: Optional[float]
    fundsCount: int
    asOf: str
    state: Optional[Literal["above", "below"]]
    streakDays: Optional[int]
    streakSince: Optional[str]


class CostBasis(TypedDict):
    assets: List[CostBasisAsset]
    updatedAt: str


class RevenueTotals(TypedDict):
    netAssetsUsd: float
    revenueUsdPerDay: float
    revenueUsdAnnualised: float
    revenueUsd30d: Optional[float]


class RevenueIssuer(TypedDict):
    issuer: str
    issuerKey: str
    funds: int
    netAssetsUsd: float
    revenueUsdPerDay: float
    revenueUsdAnnualised: float
    revenueUsd30d: Optional[float]
    avgFeePct: Optional[float]


class RevenueFund(TypedDict):
    ticker: str
    name: str
    asset: str
    issuer: str
    issuerKey: str
    netAssetsUsd: Optional[float]
    netAssetsDate: Optional[str]
    feePct: Optional[float]
    effectiveFeePct: Optional[float]
    waiverActive: bool
    waiverNote: Optional[str]
    revenueUsdPerDay: Optional[float]
    revenueUsdAnnualised: Optional[float]
    revenueUsd30d: Optional[float]


class IssuerRevenue(TypedDict):
    asOf: Optional[str]
    totals: RevenueTotals
    issuers: List[RevenueIssuer]
    funds: List[RevenueFund]
    method: str
    updatedAt: str


class StakingAsset(TypedDict):
    asset: str
    stakeable: bool
    funds: int
    fundsStaking: int
    coinsInEtfs: float
    coinsInStakingFunds: float
    stakedCoins: float
    stakedShareOfEtfCoinsPct: Optional[float]
    asOf: Optional[str]


class Staking(TypedDict):
    assets: List[StakingAsset]
    #: One record per fund: status, share staked, disclosed yields, providers,
    #: reward mode, last cash payout and the SEC ``filing`` the facts come from.
    funds: List[Dict[str, Any]]
    method: Dict[str, str]
    updatedAt: str


# "from" is a Python keyword, so these need the functional TypedDict form.
VsMinersWindow = TypedDict(
    "VsMinersWindow",
    {"key": str, "from": str, "to": str, "etfNetBtc": float, "minedBtc": float, "ratio": Optional[float]},
)


class VsMinersWeek(TypedDict):
    week: str
    through: str
    etfNetBtc: float
    minedBtc: float
    #: ETF net BTC ÷ mined BTC; None when ETFs had net outflows.
    ratio: Optional[float]
    partial: bool


class VsMiners(TypedDict):
    asOf: Optional[str]
    windows: List[VsMinersWindow]
    streakWeeks: Dict[str, Any]
    weeks: List[VsMinersWeek]
    method: Dict[str, str]
    updatedAt: str


class FundSnapshot(TypedDict):
    date: str
    sharesOutstanding: Optional[float]
    navPerShare: Optional[float]
    netAssets: Optional[float]
    coinsInTrust: Optional[float]
    marketPrice: Optional[float]
    premiumPct: Optional[float]


class FundSnapshots(TypedDict):
    ticker: str
    asset: Optional[str]
    days: List[FundSnapshot]
    updatedAt: str


class EtfPriceBar(TypedDict):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class EtfPrices(TypedDict):
    ticker: str
    days: List[EtfPriceBar]
    updatedAt: str


#: SEC filings and 13F holders are passed through as the API returns them;
#: see https://docs.cryptoetf.today for the full shape.
Filings = Dict[str, Any]
Filing = Dict[str, Any]
Institutions = Dict[str, Any]
FundInstitutions = Dict[str, Any]
