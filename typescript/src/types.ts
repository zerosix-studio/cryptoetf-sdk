/**
 * Response shapes of the CryptoETF public API v1 (https://docs.cryptoetf.today).
 * Flow values are net US$ millions, rounded to one decimal: positive = inflow,
 * negative = outflow. Dates are `YYYY-MM-DD` (UTC trading days), timestamps ISO 8601.
 */

/** Asset accepted by the per-asset endpoints. Case-insensitive; full names (`bitcoin`, `solana`, …) and `hype` also work. */
export type AssetCode =
  | "btc" | "eth" | "sol" | "xrp" | "hyp"
  | "doge" | "link" | "avax" | "hbar" | "ltc"
  | "bnb" | "dot" | "sui" | "near" | "trx" | "zec";

export interface FlowsSummaryItem {
  /** Uppercase ticker of the coin, e.g. `BTC`. */
  symbol: string;
  /** Internal asset id, e.g. `bitcoin`, `hyp`. */
  asset: string;
  /** Latest trading day with data, or null if the asset has none yet. */
  date: string | null;
  netFlowUsdM: number;
}

export interface FlowsSummary {
  assets: FlowsSummaryItem[];
  updatedAt: string;
}

export interface FlowPoint {
  date: string;
  netFlowUsdM: number;
}

export interface AssetFlows {
  symbol: string;
  asset: string;
  /** History window in days (30 on the free tier). */
  windowDays: number;
  days: FlowPoint[];
  updatedAt: string;
}

export interface FundFlow {
  ticker: string;
  issuer: string;
  /** Null when the fund has not reported this day yet. */
  netFlowUsdM: number | null;
}

export interface FundDay {
  date: string;
  totalUsdM: number;
  funds: FundFlow[];
}

export interface AssetFundFlows {
  symbol: string;
  asset: string;
  windowDays: number;
  days: FundDay[];
  updatedAt: string;
}

export interface AssetNetAssets {
  symbol: string;
  asset: string;
  totalNetAssetsUsdM: number | null;
  date: string | null;
}

export interface Fund {
  ticker: string;
  name: string;
  issuer: string;
  symbol: string;
  asset: string;
  exchange: string;
  listedAt: string;
  /** Sponsor fee, percent per year. */
  sponsorFeePct: number | null;
  netAssetsUsdM: number | null;
  coinsHeld: number | null;
  coinsHeldDate: string | null;
  netAssetsDate: string | null;
  netAssetsBasis: "reported" | "repriced" | "estimated" | null;
}

export interface Funds {
  assets: AssetNetAssets[];
  funds: Fund[];
  updatedAt: string;
}

export interface CefiComponents {
  flow: number;
  trend: number;
  breadth: number;
}

export interface IndexPoint {
  date: string;
  value: number;
}

export interface CefiIndex {
  index: string;
  /** 0–100: below 25 extreme fear, above 75 extreme greed. */
  current: number;
  components: CefiComponents | null;
  date: string;
  windowDays: number;
  history: IndexPoint[];
}

export interface Ticker {
  symbol: string;
  asset: string;
  name: string;
}

export interface Price {
  symbol: string;
  priceUsd: number;
  change24hPct: number;
}

export interface Prices {
  prices: Price[];
  updatedAt: string;
}

export interface WeeklyAsset {
  symbol: string;
  asset: string;
  netFlowUsdM: number;
  avgDailyUsdM: number;
  positiveDays: number;
  negativeDays: number;
}

export interface WeeklyAnalytics {
  /** First day of the seven-day window. */
  from: string;
  /** Last day of the window (today, UTC). */
  to: string;
  assets: WeeklyAsset[];
}

/** Rate-limit state taken from the headers of the latest response. */
export interface RateLimit {
  limit: number;
  remaining: number;
  /** Unix time (seconds) when the current window resets. */
  reset: number;
}

// ─── Paid datasets (Builder plan and above) ─────────────────────────────────
// A free key gets a 403 with code `plan_required` on every method below.

/** Asset key used by the metric endpoints: upper-case symbol, Hyperliquid is `HYPE`. */
export type MetricAsset = string;

export interface HoldingsFund {
  ticker: string;
  name: string;
  issuer: string;
  coins: number;
  /** `reported` — published by the issuer; `estimated` — net assets ÷ same-day coin price. */
  coinsBasis: "reported" | "estimated";
  /** Fraction (0–1) of the asset's ETF coins held by this fund. */
  shareOfEtfCoins: number;
  date: string;
}

export interface HoldingsAsset {
  asset: MetricAsset;
  asOf: string | null;
  coins: number;
  coinsReported: number;
  coinsEstimated: number;
  netAssetsUsd: number | null;
  circulatingSupply: number | null;
  supplyDate: string | null;
  /** Percent of circulating supply held by the ETFs (4.7 = 4.7%). */
  supplyPct: number | null;
  change7dCoins: number | null;
  change30dCoins: number | null;
  /** Change in percentage points of supply over 7 days. */
  change7dPctPoints: number | null;
  funds: HoldingsFund[];
}

export interface HoldingsHistoryPoint {
  date: string;
  coins: number;
  supplyPct: number | null;
}

export interface Holdings {
  assets: HoldingsAsset[];
  /** Daily history per asset key. */
  history: Record<MetricAsset, HoldingsHistoryPoint[]>;
  method: string;
  updatedAt: string;
}

export interface CostBasisAsset {
  asset: string;
  /** Display symbol (Hyperliquid is `HYPE`). */
  symbol: string;
  qtyCoin: number;
  costUsd: number;
  avgEntryUsd: number | null;
  price: number | null;
  marketValueUsd: number | null;
  pnlUsd: number | null;
  /** Fraction: −0.072 means −7.2%. */
  pnlPct: number | null;
  fundsCount: number;
  asOf: string;
  state: "above" | "below" | null;
  streakDays: number | null;
  streakSince: string | null;
}

export interface CostBasis {
  assets: CostBasisAsset[];
  updatedAt: string;
}

export interface RevenueTotals {
  netAssetsUsd: number;
  revenueUsdPerDay: number;
  revenueUsdAnnualised: number;
  revenueUsd30d: number | null;
}

export interface RevenueIssuer extends RevenueTotals {
  issuer: string;
  issuerKey: string;
  funds: number;
  /** Asset-weighted average fee, percent per year. */
  avgFeePct: number | null;
}

export interface RevenueFund {
  ticker: string;
  name: string;
  asset: MetricAsset;
  issuer: string;
  issuerKey: string;
  netAssetsUsd: number | null;
  netAssetsDate: string | null;
  /** Prospectus fee, percent per year. */
  feePct: number | null;
  /** Fee after temporary waivers, percent per year. */
  effectiveFeePct: number | null;
  waiverActive: boolean;
  waiverNote: string | null;
  revenueUsdPerDay: number | null;
  revenueUsdAnnualised: number | null;
  revenueUsd30d: number | null;
}

export interface IssuerRevenue {
  asOf: string | null;
  /** Whole market; not affected by the `asset` filter. */
  totals: RevenueTotals;
  /** All issuers; not affected by the `asset` filter. */
  issuers: RevenueIssuer[];
  funds: RevenueFund[];
  method: string;
  updatedAt: string;
}

export type StakingStatus =
  | "active"
  | "allowed_not_started"
  | "pending_amendment"
  | "no"
  | "not_stakeable"
  | "unknown";

export interface StakingAsset {
  asset: MetricAsset;
  stakeable: boolean;
  funds: number;
  fundsStaking: number;
  coinsInEtfs: number;
  coinsInStakingFunds: number;
  /** Estimate: coins held × disclosed (or target, or capped) staked share. */
  stakedCoins: number;
  stakedShareOfEtfCoinsPct: number | null;
  asOf: string | null;
}

export interface StakingFund {
  ticker: string;
  name: string;
  asset: MetricAsset;
  issuer: string;
  status: StakingStatus;
  note: string | null;
  maxStakedPct: number | null;
  targetStakedPct: number | null;
  disclosedStakedPct: number | null;
  disclosedStakedAsOf: string | null;
  disclosedYieldGrossPct: number | null;
  disclosedYieldNetPct: number | null;
  disclosedYieldAsOf: string | null;
  disclosedYieldLabel: string | null;
  providers: string[];
  custodian: string | null;
  /** `accrue_to_nav` — rewards stay in the fund; `cash_distribution` — paid out. */
  rewardMode: string | null;
  distributionsPerYear: number | null;
  investorSharePct: number | null;
  stakingSince: string | null;
  coins: number | null;
  coinsBasis: "reported" | "estimated" | null;
  coinsDate: string | null;
  netAssetsUsd: number | null;
  stakedCoins: number | null;
  stakedBasis: string | null;
  /** Annualised growth of coins behind each share; null where the series is not clean. */
  coinsPerShare: {
    annualPct: number;
    sePct: number;
    pairs: number;
    from: string;
    to: string;
    jumps: { date: string; pct: number }[];
    note: string;
  } | null;
  lastDistribution: {
    ticker: string;
    exDate: string;
    payDate: string;
    amountUsd: number;
    frequency: number;
  } | null;
  distributions12mUsd: number | null;
  distributionYieldPct: number | null;
  yieldNetPct: number | null;
  yieldBasis: string | null;
  checkedAt: string | null;
  /** SEC filing the facts were taken from. */
  filing: { label: string; url: string; date: string } | null;
}

export interface Staking {
  assets: StakingAsset[];
  funds: StakingFund[];
  method: Record<string, string>;
  updatedAt: string;
}

export interface VsMinersWindow {
  key: "week" | "30d" | "ytd" | "all";
  from: string;
  to: string;
  etfNetBtc: number;
  minedBtc: number;
  /** ETF net BTC ÷ mined BTC; null when ETFs had net outflows. */
  ratio: number | null;
}

export interface VsMinersWeek {
  /** Monday of the week. */
  week: string;
  through: string;
  etfNetBtc: number;
  minedBtc: number;
  ratio: number | null;
  /** True for the week still in progress. */
  partial: boolean;
}

export interface VsMiners {
  asOf: string | null;
  windows: VsMinersWindow[];
  /** Run of full weeks with ETF demand above new supply. */
  streakWeeks: { length: number; since: string | null };
  /** Every week since launch, oldest → newest. */
  weeks: VsMinersWeek[];
  method: Record<string, string>;
  updatedAt: string;
}

export interface FundSnapshot {
  date: string;
  sharesOutstanding: number | null;
  navPerShare: number | null;
  /** USD. */
  netAssets: number | null;
  coinsInTrust: number | null;
  marketPrice: number | null;
  /** (close − NAV) / NAV × 100. */
  premiumPct: number | null;
}

export interface FundSnapshots {
  ticker: string;
  asset: string | null;
  /** Oldest → newest. Collected from August 2026. */
  days: FundSnapshot[];
  updatedAt: string;
}

export interface EtfPriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Shares traded in the regular session. */
  volume: number;
}

export interface EtfPrices {
  ticker: string;
  /** Regular US session bars, oldest → newest. */
  days: EtfPriceBar[];
  updatedAt: string;
}

/**
 * Crypto ETF applications at the SEC. Nested records are passed through as the
 * API returns them; see https://docs.cryptoetf.today for the full shape.
 */
export interface Filings {
  asOf: string;
  /** Set while the SEC is in a funding lapse. */
  secLapseSince: string | null;
  summary: Record<string, unknown>;
  newest: { slug: string; name: string; filedAt: string } | null;
  lastLaunch: { slug: string; name: string; ticker: string | null; launchedAt: string } | null;
  filings: Array<Record<string, unknown> & { slug: string; name: string }>;
  /** Filing events of the last 30 days. */
  changes: Array<{ date: string; form: string; kind: string; slug: string; name: string; ticker: string | null; url: string }>;
  rejections: unknown;
  updatedAt: string;
}

/** One application with its stage, dates and SEC documents. */
export type Filing = Record<string, unknown> & { slug: string; name: string; updatedAt: string };

interface InstitutionsMeta {
  /** Quarter code, e.g. `2026Q2`. */
  period: string;
  /** Human label, e.g. `Q2 2026`. */
  quarter: string;
  quarters: { period: string; quarter: string }[];
  next: unknown;
  source: string;
}

/** 13F overview for a quarter. Nested blocks are passed through as returned. */
export interface Institutions extends InstitutionsMeta {
  summary: Record<string, unknown>;
  series: unknown[];
  typeMix: unknown[];
  movers: unknown;
  streaks: unknown;
  heldSinceStart: unknown;
  byAsset: unknown[];
  funds: unknown[];
  updatedAt: string;
}

/** Largest 13F holders of one fund. `hasData` is false when no 13F filer reported the fund. */
export interface FundInstitutions extends InstitutionsMeta {
  ticker: string;
  hasData: boolean;
  firstQuarter?: string;
  summary?: Record<string, unknown>;
  typeMix?: unknown;
  top?: Array<Record<string, unknown>>;
  movers?: unknown;
  series?: unknown[];
  updatedAt: string;
}
