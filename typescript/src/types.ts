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

/** Channel indexes behind one WSMI value, each 0–100 (null while a channel has no reading). */
export interface WsmiParts {
  etf: number | null;
  stb: number | null;
  rwa: number | null;
}

export interface WsmiPoint {
  date: string;
  /** 0–100 with one decimal; 50 = neutral. */
  value: number;
  parts: WsmiParts;
}

/** WSMI — Wall Street Money Index: spot crypto ETFs (CEFI, 50%), stablecoins (30%), tokenized assets (20%). */
export interface WsmiIndex {
  index: "WSMI";
  /** 0–100; 50 = neutral, below it more money is leaving than usual. */
  current: number;
  date: string;
  change: number | null;
  weekAgo: number | null;
  monthAgo: number | null;
  parts: WsmiParts;
  weights: { etf: number; stb: number; rwa: number };
  windowDays: number;
  history: WsmiPoint[];
}

/** Stablecoin or tokenized asset index — one WSMI channel on its own, 0–100. */
export interface ChannelIndex {
  index: "stablecoins" | "rwa";
  current: number;
  date: string;
  change: number | null;
  weekAgo: number | null;
  monthAgo: number | null;
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

// ── Stablecoins and tokenized RWA ───────────────────────────────────────────
// Amounts are whole US dollars (`…Usd`), not millions as in ETF flows.
// A missing value is null: no price ≠ worth nothing.

/** Flow fields shared by RWA rows. */
export interface UsdFlows {
  valueUsd: number | null;
  flow1dUsd: number | null;
  flow7dUsd: number | null;
  flow30dUsd: number | null;
}

export interface Stablecoin {
  id: number;
  symbol: string | null;
  name: string | null;
  issuerId: string | null;
  issuer: string | null;
  /** Peg currency, e.g. `USD`, `EUR`. */
  peg: string | null;
  circulating: number | null;
  valueUsd: number | null;
  flow7dUsd: number | null;
  flow30dUsd: number | null;
  chains: string[];
  tokens: number;
  unpricedTokens: number;
  asOf: string | null;
}

export interface Stablecoins {
  /** The chain filter, or null for every chain. */
  chain: string | null;
  methodology: string | null;
  stablecoins: Stablecoin[];
  byChain: { chain: string | null; valueUsd: number | null; tokens: number }[];
  updatedAt: string;
}

export interface StablecoinHistory {
  methodology: string | null;
  /** First date your plan can see; null = no limit. */
  historyFrom: string | null;
  days: { date: string; valueUsd: number | null }[];
  updatedAt: string;
}

export interface StablecoinDetail {
  id: number;
  symbol: string | null;
  name: string | null;
  issuerId: string | null;
  issuer: string | null;
  peg: string | null;
  contracts: Array<{
    chain: string | null;
    address: string | null;
    supply: number | null;
    circulating: number | null;
    valueUsd: number | null;
    flow7dUsd: number | null;
    flow30dUsd: number | null;
    supplyMethod: string | null;
    historyFrom: string | null;
    asOf: string | null;
  }>;
  methodology: string | null;
  historyFrom: string | null;
  days: { date: string; circulating: number | null; contracts: number }[];
  updatedAt: string;
}

export interface StablecoinsFrozen {
  methodology: string | null;
  contracts: Array<{
    symbol: string | null;
    issuerId: string | null;
    issuer: string | null;
    chain: string | null;
    contract: string | null;
    frozenAddresses: number;
    addressesWithBalance: number;
    frozen: number | null;
    frozenUsd: number | null;
    destroyed: number | null;
    method: string | null;
    asOf: string | null;
  }>;
  updatedAt: string;
}

export interface StablecoinsFrozenAddresses {
  methodology: string | null;
  topAddresses: Array<{
    chain: string | null;
    address: string | null;
    symbol: string | null;
    issuerId: string | null;
    balance: number | null;
    balanceUsd: number | null;
    frozenOn: string | null;
  }>;
  frozenUsdHistory: { date: string; frozenUsd: number | null }[];
  frozenAddressesHistory: { date: string; addresses: number }[];
  destroyedByMonth: { month: string | null; destroyedUsd: number | null; events: number }[];
  updatedAt: string;
}

export interface RwaSegment extends UsdFlows {
  segment: string | null;
  tokens: number;
  unpricedTokens: number;
  asOf: string | null;
}

export interface RwaOverview {
  methodology: string | null;
  total: { valueUsd: number; flow1dUsd: number; flow7dUsd: number; flow30dUsd: number; tokens: number; unpricedTokens: number };
  segments: RwaSegment[];
  stocksByExposure: { exposure: string | null; valueUsd: number | null; flow7dUsd: number | null; tokens: number }[];
  topIssuers: { segment: string | null; issuerId: string | null; issuer: string | null; valueUsd: number | null; flow1dUsd: number | null; products: number }[];
  movers: Array<{
    window: string | null;
    segment: string | null;
    slug: string | null;
    symbol: string | null;
    issuerId: string | null;
    issuer: string | null;
    valueUsd: number | null;
    flowUsd: number | null;
  }>;
  updatedAt: string;
}

export interface RwaSegmentFlow {
  netUsd: number | null;
  mintUsd: number | null;
  burnUsd: number | null;
  interestUsd: number | null;
}

export interface RwaMover {
  segment: string | null;
  symbol: string | null;
  issuerId: string | null;
  issuer: string | null;
  netUsd: number | null;
}

export interface RwaFlowDay {
  date: string;
  /** `final`, or `preliminary` for the current UTC day. */
  status: string | null;
  netUsd: number;
  segments: Record<string, RwaSegmentFlow>;
  /** Paid plans only. */
  issuers?: Array<RwaSegmentFlow & { issuerId: string | null; issuer: string | null; segment: string | null }>;
  /** Paid plans only. */
  topIn?: RwaMover[];
  /** Paid plans only. */
  topOut?: RwaMover[];
}

export interface RwaFlows {
  methodology: string | null;
  days: RwaFlowDay[];
  updatedAt: string;
}

export interface RwaFlowHistory {
  methodology: string | null;
  days: { date: string; status: string | null; netUsd: number | null; segments: Record<string, number | null> }[];
  updatedAt: string;
}

export interface RwaTotal extends UsdFlows {
  tokens: number;
  unpricedTokens: number;
  holders: number;
  asOf: string | null;
}

export interface RwaIssuer extends UsdFlows {
  id: string | null;
  name: string | null;
  url: string | null;
  tokens: number;
  unpricedTokens: number;
  holders: number;
  products: number;
  chains: string[];
  segments: Record<string, { valueUsd: number | null; flow7dUsd: number | null; tokens: number }>;
  asOf: string | null;
}

export interface RwaChain extends UsdFlows {
  id: string | null;
  name: string | null;
  kind: string | null;
  evmChainId: number | null;
  tokens: number;
  unpricedTokens: number;
  holders: number;
  issuers: number;
  products: number;
  historyFrom: string | null;
  asOf: string | null;
}

export interface RwaProduct extends UsdFlows {
  slug: string | null;
  symbol: string | null;
  name: string | null;
  issuerId: string | null;
  issuer: string | null;
  segment: string | null;
  assetId: string | null;
  assetSymbol: string | null;
  /** False when no price was found: `valueUsd` is then null. */
  priced: boolean;
  holders: number;
  chains: string[];
  asOf: string | null;
  // Paid plans only:
  circulating?: number | null;
  supply?: number | null;
  priceUsd?: number | null;
  priceMethod?: string | null;
  priceDay?: string | null;
  apy7d?: number | null;
  apyBasis?: string | null;
  apyFrom?: string | null;
  apyTo?: string | null;
  contracts?: number | null;
  transfersDay?: number;
}

export interface RwaToken extends UsdFlows {
  chain: string | null;
  chainName: string | null;
  address: string | null;
  status: string | null;
  slug: string | null;
  symbol: string | null;
  issuerId: string | null;
  issuer: string | null;
  segment: string | null;
  assetId: string | null;
  assetSymbol: string | null;
  supply: number | null;
  circulating: number | null;
  holders: number;
  transfersDay: number;
  priceUsd: number | null;
  priceMethod: string | null;
  priceDay: string | null;
  historyFrom: string | null;
  asOf: string | null;
}

export interface RwaAsset extends UsdFlows {
  id: string | null;
  symbol: string | null;
  kind: string | null;
  circulating: number | null;
  tokens: number;
  unpricedTokens: number;
  holders: number;
  products: number;
  issuers: string[];
  chains: string[];
  asOf: string | null;
}

/** A page of rows with the total for the filter. */
export interface RwaPage<T> {
  limit: number;
  offset: number;
  total: RwaTotal;
  /** Rows matching the filter, across all pages. */
  count: number;
  rows: T[];
  updatedAt: string;
}

export interface RwaProductDetail extends RwaProduct {
  contractsList: RwaToken[];
  days: { date: string; circulating: number | null; valueUsd: number | null }[];
  updatedAt: string;
}

export interface RwaHolders {
  chain: string;
  address: string;
  holders: { address: string | null; amount: number | null; pctOfSupply: number | null; role: string | null }[];
  updatedAt: string;
}

/** Tokenized stocks against the share price. `gap` is a fraction: 0.01 = token 1% above the share. */
export interface RwaPremiums {
  asOf: string | null;
  noiseThreshold: number | null;
  rows: Array<Record<string, unknown> & { ticker: string | null; symbol: string | null; gap: number | null; close: number | null }>;
  updatedAt: string;
}

/** Tokenized stocks over weekends. Statistics are passed through as flat objects. */
export interface RwaWeekends {
  asOf: string | null;
  noiseThreshold: number | null;
  live: Record<string, number | string | boolean | null>;
  overall: Record<string, number | string | boolean | null>;
  byMove: Record<string, number | string | boolean | null>[];
  gapFill: Record<string, number | string | boolean | null>;
  weekends: Record<string, number | string | boolean | null>[];
  updatedAt: string;
}

export interface RwaVenues {
  methodology: string | null;
  totalUsd: number | null;
  labelledUsd: number | null;
  categories: Array<{
    id: string | null;
    name: string | null;
    note: string | null;
    valueUsd: number | null;
    bySegment: Record<string, number | null>;
    protocols: Array<{
      name: string | null;
      valueUsd: number | null;
      chains: string[];
      bySegment: Record<string, number | null>;
      tokens: { symbol: string | null; segment: string | null; valueUsd: number | null }[];
    }>;
  }>;
  updatedAt: string;
}

/** Filters accepted by RWA lists: comma-separated ids. */
export interface RwaFilter {
  segment?: string;
  issuer?: string;
  chain?: string;
  asset?: string;
}

export interface RwaPaging {
  limit?: number;
  offset?: number;
}
