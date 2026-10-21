# CryptoETF — TypeScript SDK for spot crypto ETF flows

[![npm](https://img.shields.io/npm/v/@zerosix-studio/cryptoetf?color=cb3837&logo=npm)](https://www.npmjs.com/package/@zerosix-studio/cryptoetf)

The official client for the [CryptoETF API](https://docs.cryptoetf.today): daily net
flows of every US-listed spot crypto ETF, fund by fund, plus fund AUM, the CEFI
sentiment index and coin prices. Data by [cryptoetf.today](https://cryptoetf.today).

Sixteen assets: **BTC, ETH, SOL, XRP, HYPE, DOGE, LINK, AVAX, HBAR, LTC, BNB,
DOT, SUI, NEAR, TRX, ZEC**. Zero dependencies, fully typed, Node 18+, Deno, Bun
and modern browsers.

## Install

```bash
npm install @zerosix-studio/cryptoetf
```

## Get an API key

Sign in at [cryptoetf.today](https://cryptoetf.today/en/profile) and create a key
in **Profile → For developers**. It is free.

## Quick start

```ts
import { CryptoETF } from "@zerosix-studio/cryptoetf";

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
| `cefi()` | `GET /v1/index/cefi` | CEFI sentiment index (0–100) and its history |
| `tickers()` | `GET /v1/tickers` | Tracked assets |
| `prices()` | `GET /v1/prices` | Spot prices of the 16 coins |
| `weekly()` | `GET /v1/analytics/weekly` | Seven-day totals per asset |

`asset` is a code such as `btc`, `eth`, `sol`, `hype` or a full name such as
`bitcoin`. All values are net US$ millions: positive = inflow, negative = outflow.
Full field reference: [docs.cryptoetf.today](https://docs.cryptoetf.today).

## Errors and limits

Every failed call throws `CryptoETFError` with `status`, an optional `code` and,
on HTTP 429, `retryAfter` in seconds:

```ts
import { CryptoETFError } from "@zerosix-studio/cryptoetf";

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
  baseUrl: "https://api.cryptoetf.today/api/v1",
  fetch: customFetch,
});
```

## Related

- **No-code access for AI agents:** the hosted MCP server at
  `https://mcp.cryptoetf.today/api/mcp`
  ([@zerosix-studio/cryptoetf-mcp](https://www.npmjs.com/package/@zerosix-studio/cryptoetf-mcp)).
- **Embeddable widgets:** [cryptoetf.today/en/crypto-etf-widgets](https://cryptoetf.today/en/crypto-etf-widgets)

Not investment advice. MIT licensed.
