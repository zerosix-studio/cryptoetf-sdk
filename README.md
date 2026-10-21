# CryptoETF SDKs

Official clients for the [CryptoETF API](https://docs.cryptoetf.today): daily net
flows of every US-listed spot crypto ETF for 16 assets (BTC, ETH, SOL, XRP, HYPE,
DOGE, LINK, AVAX, HBAR, LTC, BNB, DOT, SUI, NEAR, TRX, ZEC), fund by fund, plus
fund AUM, the CEFI sentiment index and coin prices.

| Language | Package | Folder |
|---|---|---|
| TypeScript / JavaScript | [`cryptoetf`](https://www.npmjs.com/package/cryptoetf) | [`typescript/`](typescript) |
| Python | [`cryptoetf`](https://pypi.org/project/cryptoetf/) | [`python/`](python) |

Both are zero-dependency and expose the same methods: `flows.summary()`,
`flows.asset(asset)`, `flows.funds(asset)`, `funds()`, `cefi()`, `tickers()`,
`prices()`, `weekly()`.

**API key:** free, from [cryptoetf.today → Profile → For developers](https://cryptoetf.today/en/profile).
The free tier covers the last 30 days; 120 requests per minute per key.

Data by [cryptoetf.today](https://cryptoetf.today). Not investment advice. MIT licensed.
