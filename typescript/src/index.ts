import type {
  AssetCode,
  AssetFlows,
  AssetFundFlows,
  CefiIndex,
  ChannelIndex,
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
  WsmiIndex,
  RwaAsset,
  RwaChain,
  RwaFilter,
  RwaFlowHistory,
  RwaFlows,
  RwaHolders,
  RwaIssuer,
  RwaOverview,
  RwaPage,
  RwaPaging,
  RwaPremiums,
  RwaProduct,
  RwaProductDetail,
  RwaToken,
  RwaTotal,
  RwaVenues,
  RwaWeekends,
  StablecoinDetail,
  StablecoinHistory,
  Stablecoins,
  StablecoinsFrozen,
  StablecoinsFrozenAddresses,
  Staking,
  Ticker,
  VsMiners,
  WeeklyAnalytics,
} from "./types.js";

type AssetArg = AssetCode | (string & {});
const assetQuery = (asset?: AssetArg) => (asset ? { asset } : undefined);
const seg = (v: string) => encodeURIComponent(v);
/** Non-empty values become query params; numbers are stringified. */
const query = (q: Record<string, string | number | undefined>) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") out[k] = String(v);
  return Object.keys(out).length ? out : undefined;
};

export type * from "./types.js";

export const DEFAULT_BASE_URL = "https://api.cryptoetf.today/v1";

export interface CryptoETFOptions {
  /** API key from https://cryptoetf.today/en/console/keys. Defaults to the `CRYPTOETF_API_KEY` environment variable. */
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
 * ETF prices, SEC filings and 13F holders. Also stablecoins and tokenized real-world assets (RWA).
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
        "API key required. Get a free key at https://cryptoetf.today/en/console/keys and pass it as { apiKey } or set CRYPTOETF_API_KEY.",
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

  /**
   * WSMI — Wall Street Money Index: one 0–100 reading across spot crypto ETFs (CEFI, 50%),
   * stablecoins (30%) and tokenized assets (20%), with channel parts and history. Same numbers as cryptoetf.today.
   */
  wsmi(): Promise<WsmiIndex> {
    return this.get("/index/wsmi");
  }

  /** CEFI — Crypto ETF Flow Index, the ETF channel of WSMI: a 0–100 gauge with its recent history. */
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

  /**
   * Stablecoins: supply, USD value and flows per coin and chain. Amounts are whole US dollars.
   * Free keys get the snapshot and 30 days of history; paid plans the whole history and frozen addresses.
   */
  readonly stablecoins = {
    /** Stablecoin index: the WSMI channel for stablecoins, 0–100, with history. */
    index: (): Promise<ChannelIndex> => this.get("/index/stablecoins"),
    /** Every stablecoin with circulating supply, USD value and 7/30-day flows; one chain if `chain` is given. */
    list: (chain?: string): Promise<Stablecoins> => this.get("/stablecoins", query({ chain })),
    /** Daily USD value: all stablecoins, one chain and / or one coin (`id` from `list()`). */
    history: (options: { chain?: string; id?: number } = {}): Promise<StablecoinHistory> =>
      this.get("/stablecoins/history", query(options)),
    /** One coin: contracts on every chain and daily circulating supply. */
    get: (id: number): Promise<StablecoinDetail> => this.get(`/stablecoins/${seg(String(id))}`),
    /** Frozen balances per coin contract. */
    frozen: (): Promise<StablecoinsFrozen> => this.get("/stablecoins/frozen"),
    /** Largest frozen addresses and the frozen history. Paid plans. */
    frozenAddresses: (): Promise<StablecoinsFrozenAddresses> => this.get("/stablecoins/frozen/addresses"),
  };

  /**
   * Tokenized real-world assets: treasuries, gold, stocks, credit and more. Amounts are whole US dollars.
   * Free keys get the market snapshot, 30 days of flows and the top 25 products; the rest is on paid plans.
   */
  readonly rwa = {
    /** Tokenized asset index: the WSMI channel for tokenized assets, 0–100, with history. */
    index: (): Promise<ChannelIndex> => this.get("/index/rwa"),
    /** Market by segment with totals, top issuers and movers. */
    overview: (): Promise<RwaOverview> => this.get("/rwa/overview"),
    /** Daily net flow by segment (Free: up to 30 days; paid: up to 120 days with issuers and top products). */
    flows: (days?: number): Promise<RwaFlows> => this.get("/rwa/flows", query({ days })),
    /** Daily net flow over the whole history. Paid plans. */
    flowHistory: (): Promise<RwaFlowHistory> => this.get("/rwa/flows/history"),
    /** Every issuer with value, flows, tokens, holders and segments. */
    issuers: (filter: Omit<RwaFilter, "issuer"> = {}): Promise<{ total: RwaTotal; issuers: RwaIssuer[]; updatedAt: string }> =>
      this.get("/rwa/issuers", query({ ...filter })),
    /** Every chain with tokenized assets. */
    chains: (filter: Omit<RwaFilter, "chain"> = {}): Promise<{ total: RwaTotal; chains: RwaChain[]; updatedAt: string }> =>
      this.get("/rwa/chains", query({ ...filter })),
    /** Products, largest first (Free: top 25; paid: every product, paged, with price and APY). */
    products: (options: RwaFilter & RwaPaging = {}): Promise<RwaPage<RwaProduct>> =>
      this.get("/rwa/products", query({ ...options })),
    /** One product by slug, ticker or contract address, with contracts and daily history. Paid plans. */
    product: (slug: string, days?: number): Promise<RwaProductDetail> =>
      this.get(`/rwa/products/${seg(slug)}`, query({ days })),
    /** Underlyings (a share, T-bills, gold …) summed over issuers and chains. Paid plans. */
    assets: (options: Omit<RwaFilter, "asset"> & RwaPaging = {}): Promise<RwaPage<RwaAsset>> =>
      this.get("/rwa/assets", query({ ...options })),
    /** Token contracts; pass `address` to find one contract on any chain. Paid plans. */
    tokens: (options: RwaFilter & RwaPaging & { address?: string } = {}): Promise<RwaPage<RwaToken>> =>
      this.get("/rwa/tokens", query({ ...options })),
    /** Largest holders of one contract. Paid plans. */
    holders: (chain: string, address: string, limit?: number): Promise<RwaHolders> =>
      this.get(`/rwa/tokens/${seg(chain)}/${seg(address)}/holders`, query({ limit })),
    /** Tokenized stocks against the share price. Paid plans. */
    premiums: (): Promise<RwaPremiums> => this.get("/rwa/premiums"),
    /** Tokenized stocks over weekends. Paid plans. */
    weekends: (): Promise<RwaWeekends> => this.get("/rwa/weekends"),
    /** Where tokenized assets are held: lending, DEX pools, reserves, vaults. Paid plans. */
    venues: (): Promise<RwaVenues> => this.get("/rwa/venues"),
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
