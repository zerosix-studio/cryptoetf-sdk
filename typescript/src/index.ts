import type {
  AssetCode,
  AssetFlows,
  AssetFundFlows,
  CefiIndex,
  Funds,
  FlowsSummary,
  Prices,
  RateLimit,
  Ticker,
  WeeklyAnalytics,
} from "./types.js";

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
