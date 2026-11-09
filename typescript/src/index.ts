import type {
  AssetCode,
  AssetFlows,
  AssetFundFlows,
  CefiIndex,
  CostBasis,
  EtfPrices,
  Filing,
  Filings,
  FundInstitutions,
  FundSnapshots,
  Funds,
  FlowsSummary,
  Holdings,
  Institutions,
  IssuerRevenue,
  Prices,
  RateLimit,
  Staking,
  Ticker,
  VsMiners,
  WeeklyAnalytics,
} from "./types.js";

type AssetArg = AssetCode | (string & {});
const assetQuery = (asset?: AssetArg) => (asset ? { asset } : undefined);
const seg = (v: string) => encodeURIComponent(v);

export type * from "./types.js";

export const DEFAULT_BASE_URL = "https://api.cryptoetf.today/api/v1";

export interface CryptoETFOptions {
  /** API key from https://cryptoetf.today/en/profile. Defaults to the `CRYPTOETF_API_KEY` environment variable. */
  apiKey?: string;
  /** Override the API root, e.g. for a proxy. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default 15 000. */
  timeoutMs?: number;
  /** Custom fetch implementation (tests, proxies, older runtimes). */
  fetch?: typeof fetch;
}

/** Error returned by the API (4xx/5xx) or raised by the client (timeout, network). */
export class CryptoETFError extends Error {
  /** HTTP status; 0 for network errors and timeouts. */
  readonly status: number;
  /** Machine-readable code when the API sends one, e.g. `api_key_suspended`. */
  readonly code?: string;
  /** Seconds to wait before retrying, on 429. */
  readonly retryAfter?: number;

  constructor(message: string, status: number, code?: string, retryAfter?: number) {
    super(message);
    this.name = "CryptoETFError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function envKey(): string | undefined {
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.CRYPTOETF_API_KEY;
}

/**
 * Client for the CryptoETF public API: daily net flows of US spot crypto ETFs
 * for 16 assets, fund by fund, plus fund AUM, the CEFI sentiment index and coin prices.
 * Paid plans add holdings, cost basis, staking, issuer revenue, BTC vs miners, fund snapshots,
 * ETF prices, SEC filings and 13F holders.
 *
 * ```ts
 * const etf = new CryptoETF({ apiKey: "…" });
 * const { assets } = await etf.flows.summary();
 * ```
 */
export class CryptoETF {
  /** Rate-limit headers of the most recent response, or null before the first call. */
  rateLimit: RateLimit | null = null;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CryptoETFOptions = {}) {
    const key = options.apiKey ?? envKey();
    if (!key) {
      throw new CryptoETFError(
        "API key required. Get a free key at https://cryptoetf.today/en/profile and pass it as { apiKey } or set CRYPTOETF_API_KEY.",
        401,
      );
    }
    this.apiKey = key;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 15_000;
    const f = options.fetch ?? globalThis.fetch;
    if (!f) throw new CryptoETFError("No fetch available: use Node 18+ or pass { fetch }.", 0);
    this.fetchImpl = f.bind(globalThis);
  }

  /** Daily net flows. */
  readonly flows = {
    /** Latest daily net flow for every asset. */
    summary: (): Promise<FlowsSummary> => this.get("/flows/summary"),
    /** Daily net flows of one asset over the history window (30 days on the free tier). */
    asset: (asset: AssetCode | (string & {})): Promise<AssetFlows> =>
      this.get(`/flows/${encodeURIComponent(asset)}`),
    /** Daily net flows of one asset, fund by fund. */
    funds: (asset: AssetCode | (string & {})): Promise<AssetFundFlows> =>
      this.get(`/flows/${encodeURIComponent(asset)}/funds`),
  };

  /** Fund directory with assets under management; all 16 assets unless `asset` is given. */
  funds(asset?: AssetCode | (string & {})): Promise<Funds> {
    return this.get("/funds", asset ? { asset } : undefined);
  }

  /** CEFI — Crypto ETF Flow Index, a 0–100 sentiment gauge, with its recent history. */
  cefi(): Promise<CefiIndex> {
    return this.get("/index/cefi");
  }

  /** Assets the API tracks. */
  tickers(): Promise<Ticker[]> {
    return this.get("/tickers");
  }

  /** Spot prices of the 16 coins. */
  prices(): Promise<Prices> {
    return this.get("/prices");
  }

  /** Seven-day flow totals per asset. */
  weekly(): Promise<WeeklyAnalytics> {
    return this.get("/analytics/weekly");
  }

  // ── Paid datasets: Builder plan and above. A free key gets 403 `plan_required`. ──

  /** Coins held in trust by the ETFs, per fund and per asset, with share of supply and daily history. Paid plans. */
  holdings(asset?: AssetArg): Promise<Holdings> {
    return this.get("/holdings", assetQuery(asset));
  }

  /** Living metrics computed from flows, fees and SEC filings. Paid plans. */
  readonly metrics = {
    /** Estimated average entry price of ETF holders, unrealised P&L and the above/below-entry streak. */
    costBasis: (asset?: AssetArg): Promise<CostBasis> => this.get("/metrics/cost-basis", assetQuery(asset)),
    /** Estimated sponsor fee revenue per fund, per issuer and for the market. */
    issuerRevenue: (asset?: AssetArg): Promise<IssuerRevenue> => this.get("/metrics/issuer-revenue", assetQuery(asset)),
    /** Staking status, share staked, disclosed yields and providers of each fund. */
    staking: (asset?: AssetArg): Promise<Staking> => this.get("/metrics/staking", assetQuery(asset)),
    /** Bitcoin ETF net creations in BTC against newly mined bitcoin. */
    vsMiners: (): Promise<VsMiners> => this.get("/metrics/vs-miners"),
  };

  /** Daily snapshots of one fund: shares outstanding, NAV, net assets, coins, premium. Paid plans. */
  fundSnapshots(ticker: string): Promise<FundSnapshots> {
    return this.get(`/funds/${seg(ticker)}/snapshots`);
  }

  /** Daily OHLCV of one ETF ticker for the regular US session. Paid plans. */
  etfPrices(ticker: string): Promise<EtfPrices> {
    return this.get(`/etf-prices/${seg(ticker)}`);
  }

  /** Crypto ETF applications at the SEC. Paid plans. */
  readonly filings = {
    /** Every tracked application with its stage, key dates and recent documents. */
    list: (): Promise<Filings> => this.get("/filings"),
    /** One application with its full document history; slugs come from `list()`. */
    get: (slug: string): Promise<Filing> => this.get(`/filings/${seg(slug)}`),
  };

  /** Institutional holders from quarterly SEC 13F filings. Paid plans. */
  readonly institutions = {
    /** 13F overview for a quarter (latest unless `period`, e.g. `2026Q2`). */
    overview: (period?: string): Promise<Institutions> =>
      this.get("/institutions", period ? { period } : undefined),
    /** Largest 13F holders of one fund, up to `limit` (default 10, max 50). */
    fund: (ticker: string, options: { period?: string; limit?: number } = {}): Promise<FundInstitutions> => {
      const q: Record<string, string> = {};
      if (options.period) q.period = options.period;
      if (options.limit !== undefined) q.limit = String(options.limit);
      return this.get(`/institutions/funds/${seg(ticker)}`, Object.keys(q).length ? q : undefined);
    },
  };

  private async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
        signal: ctrl.signal,
      });
    } catch (err) {
      const timedOut = (err as Error)?.name === "AbortError";
      throw new CryptoETFError(timedOut ? `Request timed out after ${this.timeoutMs} ms` : `Network error: ${(err as Error)?.message ?? err}`, 0);
    } finally {
      clearTimeout(timer);
    }

    const limit = Number(res.headers.get("x-ratelimit-limit"));
    if (limit) {
      this.rateLimit = {
        limit,
        remaining: Number(res.headers.get("x-ratelimit-remaining")),
        reset: Number(res.headers.get("x-ratelimit-reset")),
      };
    }

    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const b = (body ?? {}) as { message?: unknown; code?: unknown };
      const message = Array.isArray(b.message) ? b.message.join("; ") : typeof b.message === "string" ? b.message : res.statusText || `HTTP ${res.status}`;
      const retry = Number(res.headers.get("retry-after"));
      throw new CryptoETFError(message, res.status, typeof b.code === "string" ? b.code : undefined, retry || undefined);
    }
    return body as T;
  }
}

export default CryptoETF;
