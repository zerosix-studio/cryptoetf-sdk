# CryptoETF — Python SDK for spot crypto ETF flows

[![PyPI](https://img.shields.io/pypi/v/cryptoetf?color=3775a9&logo=pypi&logoColor=white)](https://pypi.org/project/cryptoetf/)

The official client for the [CryptoETF API](https://docs.cryptoetf.today): daily net
flows of every US-listed spot crypto ETF, fund by fund, plus fund AUM, the CEFI
sentiment index and coin prices. Data by [cryptoetf.today](https://cryptoetf.today).

Sixteen assets: **BTC, ETH, SOL, XRP, HYPE, DOGE, LINK, AVAX, HBAR, LTC, BNB,
DOT, SUI, NEAR, TRX, ZEC**. Zero dependencies (standard library only), typed,
Python 3.9+.

## Install

```bash
pip install cryptoetf
```

## Get an API key

Sign in at [cryptoetf.today](https://cryptoetf.today/en/profile) and create a key
in **Profile → For developers**. It is free.

## Quick start

```python
from cryptoetf import CryptoETF

etf = CryptoETF(api_key="...")  # or set CRYPTOETF_API_KEY

# Latest daily net flow for every asset, US$ millions
for a in etf.flows.summary()["assets"]:
    print(a["symbol"], a["date"], a["netFlowUsdM"])

# Bitcoin ETFs fund by fund
btc = etf.flows.funds("btc")
last_day = btc["days"][-1]
print([(f["ticker"], f["netFlowUsdM"]) for f in last_day["funds"]])
```

Responses are plain dicts with the same field names as the API, so they drop
straight into pandas:

```python
import pandas as pd

df = pd.DataFrame(etf.flows.asset("eth")["days"])
```

## Methods

| Method | Endpoint | Returns |
|---|---|---|
| `flows.summary()` | `GET /v1/flows/summary` | Latest net flow per asset |
| `flows.asset(asset)` | `GET /v1/flows/{asset}` | Daily net flows of one asset |
| `flows.funds(asset)` | `GET /v1/flows/{asset}/funds` | Daily net flows of one asset, per fund |
| `funds(asset=None)` | `GET /v1/funds` | Fund directory with AUM, fees, coins held |
| `cefi()` | `GET /v1/index/cefi` | CEFI sentiment index (0–100) and its history |
| `tickers()` | `GET /v1/tickers` | Tracked assets |
| `prices()` | `GET /v1/prices` | Spot prices of the 16 coins |
| `weekly()` | `GET /v1/analytics/weekly` | Seven-day totals per asset |

### Paid datasets

These need a paid API plan; a free key gets `403` with `code == "plan_required"`.

| Method | Endpoint | Returns |
|---|---|---|
| `holdings(asset=None)` | `GET /v1/holdings` | Coins held by the ETFs, share of circulating supply, per fund, with daily history |
| `metrics.cost_basis(asset=None)` | `GET /v1/metrics/cost-basis` | Estimated average entry price of holders, unrealised P&L, streak above/below entry |
| `metrics.issuer_revenue(asset=None)` | `GET /v1/metrics/issuer-revenue` | Estimated sponsor fee revenue per fund, issuer and market |
| `metrics.staking(asset=None)` | `GET /v1/metrics/staking` | Staking status, share staked, disclosed yields and providers per fund |
| `metrics.vs_miners()` | `GET /v1/metrics/vs-miners` | Bitcoin ETF net creations in BTC against newly mined bitcoin |
| `fund_snapshots(ticker)` | `GET /v1/funds/{ticker}/snapshots` | Daily shares outstanding, NAV, net assets, coins and premium of one fund |
| `etf_prices(ticker)` | `GET /v1/etf-prices/{ticker}` | Daily OHLCV of one ETF, regular session |
| `filings.list()` | `GET /v1/filings` | Crypto ETF applications at the SEC with stage and dates |
| `filings.get(slug)` | `GET /v1/filings/{slug}` | One application with its document history |
| `institutions.overview(period=None)` | `GET /v1/institutions` | 13F institutional holders for a quarter |
| `institutions.fund(ticker, period=None, limit=None)` | `GET /v1/institutions/funds/{ticker}` | Largest 13F holders of one fund |

`asset` is a code such as `btc`, `eth`, `sol`, `hype` or a full name such as
`bitcoin`. All values are net US$ millions: positive = inflow, negative = outflow.
Full field reference: [docs.cryptoetf.today](https://docs.cryptoetf.today).

## Errors and limits

Every failed call raises `CryptoETFError` with `status`, an optional `code` and,
on HTTP 429, `retry_after` in seconds:

```python
from cryptoetf import CryptoETFError

try:
    etf.prices()
except CryptoETFError as e:
    if e.status == 429:
        print(f"rate limited, retry in {e.retry_after}s")
```

- **Rate limit:** 120 requests per minute per key. The latest limit headers are
  available as `etf.rate_limit`.
- **History:** the free tier covers the **last 30 days**. Full history will be
  available on a paid plan.
- **Freshness:** a trading day appears the next morning (UTC), before the US
  open. The newest day can be revised once later that day. SUI funds arrive a
  day later.

## Options

```python
CryptoETF(
    api_key="...",          # default: CRYPTOETF_API_KEY
    timeout=15.0,           # seconds per request
    base_url="https://api.cryptoetf.today/v1",
)
```

## Related

- **TypeScript SDK:** [cryptoetf](https://www.npmjs.com/package/cryptoetf)
- **No-code access for AI agents:** the hosted MCP server at
  `https://mcp.cryptoetf.today/api/mcp`
- **Embeddable widgets:** [cryptoetf.today/en/crypto-etf-widgets](https://cryptoetf.today/en/crypto-etf-widgets)

Not investment advice. MIT licensed.
