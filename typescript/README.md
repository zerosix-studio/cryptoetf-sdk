# CryptoETF — TypeScript SDK for spot crypto ETF flows

[![npm](https://img.shields.io/npm/v/cryptoetf?color=cb3837&logo=npm)](https://www.npmjs.com/package/cryptoetf)

The official client for the [CryptoETF API](https://docs.cryptoetf.today): daily net
flows of every US-listed spot crypto ETF, fund by fund, plus fund AUM, the Wall
Street Money Index (WSMI) and the CEFI ETF flow index, and coin prices. Data by [cryptoetf.today](https://cryptoetf.today).

Sixteen assets: **BTC, ETH, SOL, XRP, HYPE, DOGE, LINK, AVAX, HBAR, LTC, BNB,
DOT, SUI, NEAR, TRX, ZEC**. Zero dependencies, fully typed, Node 18+, Deno, Bun
and modern browsers.

## Install

```bash
npm install cryptoetf
```

## Get an API key

Sign in to the [developer console](https://cryptoetf.today/en/console/keys) and create a key
under **API keys**. It is free.

## Quick start

```ts
import { CryptoETF } from "cryptoetf";

const etf = new CryptoETF({ apiKey: process.env.CRYPTOETF_API_KEY });

// Latest daily net flow for every asset, US$ millions
const { assets } = await etf.flows.summary();
for (const a of assets) console.log(a.symbol, a.date, a.netFlowUsdM);

// Bitcoin ETFs fund by fund
const btc = await etf.flows.funds("btc");
const lastDay = btc.days.at(-1);
console.log(lastDay?.funds.map((f) => `${f.ticker} ${f.netFlowUsdM}`));
```

If `apiKey` is omitted, the client reads `CRYPTOETF_API_KEY` from the environment.

## Methods

| Method | Endpoint | Returns |
|---|---|---|
| `flows.summary()` | `GET /v1/flows/summary` | Latest net flow per asset |
| `flows.asset(asset)` | `GET /v1/flows/{asset}` | Daily net flows of one asset |
| `flows.funds(asset)` | `GET /v1/flows/{asset}/funds` | Daily net flows of one asset, per fund |
| `funds(asset?)` | `GET /v1/funds` | Fund directory with AUM, fees, coins held |
| `wsmi()` | `GET /v1/index/wsmi` | Wall Street Money Index (0–100): ETFs 50%, stablecoins 30%, tokenized assets 20%, with channel parts and history |
| `cefi()` | `GET /v1/index/cefi` | CEFI — Crypto ETF Flow Index, the ETF channel of WSMI (0–100), and its history |
| `tickers()` | `GET /v1/tickers` | Tracked assets |
| `prices()` | `GET /v1/prices` | Spot prices of the 16 coins |
| `weekly()` | `GET /v1/analytics/weekly` | Seven-day totals per asset |

### Paid datasets

These need a paid API plan; a free key gets `403` with `code: "plan_required"`.

| Method | Endpoint | Returns |
|---|---|---|
| `holdings(asset?)` | `GET /v1/holdings` | Coins held by the ETFs, share of circulating supply, per fund, with daily history |
| `metrics.costBasis(asset?)` | `GET /v1/metrics/cost-basis` | Estimated average entry price of holders, unrealised P&L, streak above/below entry |
| `metrics.issuerRevenue(asset?)` | `GET /v1/metrics/issuer-revenue` | Estimated sponsor fee revenue per fund, issuer and market |
| `metrics.staking(asset?)` | `GET /v1/metrics/staking` | Staking status, share staked, disclosed yields and providers per fund |
| `metrics.vsMiners()` | `GET /v1/metrics/vs-miners` | Bitcoin ETF net creations in BTC against newly mined bitcoin |
| `fundSnapshots(ticker)` | `GET /v1/funds/{ticker}/snapshots` | Daily shares outstanding, NAV, net assets, coins and premium of one fund |
| `etfPrices(ticker)` | `GET /v1/etf-prices/{ticker}` | Daily OHLCV of one ETF, regular session |
| `filings.list()` | `GET /v1/filings` | Crypto ETF applications at the SEC with stage and dates |
| `filings.get(slug)` | `GET /v1/filings/{slug}` | One application with its document history |
| `institutions.overview(period?)` | `GET /v1/institutions` | 13F institutional holders for a quarter |
| `institutions.fund(ticker, { period?, limit? })` | `GET /v1/institutions/funds/{ticker}` | Largest 13F holders of one fund |

### Stablecoins and tokenized RWA

Amounts are whole US dollars (`…Usd`), not millions. A free key gets the current
snapshot, 30 days of history and the top 25 products; methods marked *paid* need a
paid plan. List filters (`segment`, `issuer`, `chain`, `asset`) take comma-separated ids.

| Method | Endpoint | Returns |
|---|---|---|
| `stablecoins.index()` | `GET /v1/index/stablecoins` | Stablecoin index (0–100), the WSMI channel, with history |
| `stablecoins.list(chain?)` | `GET /v1/stablecoins` | Every stablecoin: circulating supply, USD value, 7/30-day flows, totals per chain |
| `stablecoins.history({ chain?, id? })` | `GET /v1/stablecoins/history` | Daily USD value (Free: 30 days; paid: from 2017) |
| `stablecoins.get(id)` | `GET /v1/stablecoins/{id}` | One coin: contracts on every chain, daily circulating |
| `stablecoins.frozen()` | `GET /v1/stablecoins/frozen` | Frozen balances per coin contract |
| `stablecoins.frozenAddresses()` | `GET /v1/stablecoins/frozen/addresses` | *Paid.* Largest frozen addresses and frozen history |
| `rwa.index()` | `GET /v1/index/rwa` | Tokenized asset index (0–100), the WSMI channel, with history |
| `rwa.overview()` | `GET /v1/rwa/overview` | Market by segment, totals, top issuers, movers |
| `rwa.flows(days?)` | `GET /v1/rwa/flows` | Daily net flow by segment (paid: 120 days, by issuer, top products) |
| `rwa.flowHistory()` | `GET /v1/rwa/flows/history` | *Paid.* Daily net flow over the whole history |
| `rwa.issuers(filter?)` | `GET /v1/rwa/issuers` | Issuers with value, flows, holders, segments |
| `rwa.chains(filter?)` | `GET /v1/rwa/chains` | Chains with tokenized assets |
| `rwa.products({ …filter, limit?, offset? })` | `GET /v1/rwa/products` | Products, largest first (paid: all, paged, with price and APY) |
| `rwa.product(slug, days?)` | `GET /v1/rwa/products/{slug}` | *Paid.* One product with contracts and daily history |
| `rwa.assets(options?)` | `GET /v1/rwa/assets` | *Paid.* Underlyings summed over issuers and chains |
| `rwa.tokens(options?)` | `GET /v1/rwa/tokens` | *Paid.* Token contracts |
| `rwa.holders(chain, address, limit?)` | `GET /v1/rwa/tokens/{chain}/{address}/holders` | *Paid.* Largest holders of one contract |
| `rwa.premiums()` | `GET /v1/rwa/premiums` | *Paid.* Tokenized stocks against the share price |
| `rwa.weekends()` | `GET /v1/rwa/weekends` | *Paid.* Tokenized stocks over weekends |
| `rwa.venues()` | `GET /v1/rwa/venues` | *Paid.* Where tokenized assets are held |

`asset` is a code such as `btc`, `eth`, `sol`, `hype` or a full name such as
`bitcoin`. All values are net US$ millions: positive = inflow, negative = outflow.
Full field reference: [docs.cryptoetf.today](https://docs.cryptoetf.today).

## Errors and limits

Every failed call throws `CryptoETFError` with `status`, an optional `code` and,
on HTTP 429, `retryAfter` in seconds:

```ts
import { CryptoETFError } from "cryptoetf";

try {
  await etf.prices();
} catch (e) {
  if (e instanceof CryptoETFError && e.status === 429) {
    console.log(`rate limited, retry in ${e.retryAfter}s`);
  }
}
```

- **Rate limit:** 120 requests per minute per key. The latest limit headers are
  available as `etf.rateLimit`.
- **History:** the free tier covers the **last 30 days**. Full history will be
  available on a paid plan.
- **Freshness:** a trading day appears the next morning (UTC), before the US
  open. The newest day can be revised once later that day. SUI funds arrive a
  day later.

## Options

```ts
new CryptoETF({
  apiKey: "…",       // default: process.env.CRYPTOETF_API_KEY
  timeoutMs: 15000,  // per request
  baseUrl: "https://api.cryptoetf.today/v1",
  fetch: customFetch,
});
```

## Related

- **Python SDK:** [cryptoetf on PyPI](https://pypi.org/project/cryptoetf/), same methods.
- **No-code access for AI agents:** the hosted MCP server at
  `https://mcp.cryptoetf.today/mcp`
  ([@zerosix-studio/cryptoetf-mcp](https://www.npmjs.com/package/@zerosix-studio/cryptoetf-mcp)).
- **Embeddable widgets:** [cryptoetf.today/en/crypto-etf-widgets](https://cryptoetf.today/en/crypto-etf-widgets)

Not investment advice. MIT licensed.
