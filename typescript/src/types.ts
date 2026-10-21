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
