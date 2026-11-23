# CryptoETF SDKs

Official clients for the [CryptoETF API](https://docs.cryptoetf.today): daily net
flows of every US-listed spot crypto ETF for 16 assets (BTC, ETH, SOL, XRP, HYPE,
DOGE, LINK, AVAX, HBAR, LTC, BNB, DOT, SUI, NEAR, TRX, ZEC), fund by fund, plus
fund AUM, the Wall Street Money Index (WSMI) and the CEFI ETF flow index, and coin prices. Also stablecoins and
tokenized real-world assets (RWA).

| Language | Package | Folder |
|---|---|---|
| TypeScript / JavaScript | [`cryptoetf`](https://www.npmjs.com/package/cryptoetf) | [`typescript/`](typescript) |
| Python | [`cryptoetf`](https://pypi.org/project/cryptoetf/) | [`python/`](python) |

Both are zero-dependency and expose the same methods: `flows.summary()`,
`flows.asset(asset)`, `flows.funds(asset)`, `funds()`, `wsmi()`, `cefi()`, `tickers()`,
`prices()`, `weekly()`. On a paid plan they also cover holdings, cost basis,
issuer revenue, staking, bitcoin ETF demand against mined supply, daily fund
snapshots, ETF prices, SEC filings and 13F institutional holders
(`snake_case` names in Python, `camelCase` in TypeScript). Stablecoins and
tokenized real-world assets are under `stablecoins.*` and `rwa.*`, including
`stablecoins.index()` and `rwa.index()` — the two WSMI channels.

**API key:** free, from [the developer console](https://cryptoetf.today/en/console/keys).
The free tier covers the last 30 days; 60 requests per minute per key (300 on paid plans).

Data by [cryptoetf.today](https://cryptoetf.today). Not investment advice. MIT licensed.
