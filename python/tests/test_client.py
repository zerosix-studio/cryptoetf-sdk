import json
import os
import unittest

from cryptoetf import CryptoETF, CryptoETFError


def fake(status, body, headers=None):
    calls = []

    def transport(url, hdrs, timeout):
        calls.append((url, hdrs))
        return status, {k.lower(): v for k, v in (headers or {}).items()}, json.dumps(body).encode()

    transport.calls = calls
    return transport


class ClientTest(unittest.TestCase):
    def test_requires_key(self):
        saved = os.environ.pop("CRYPTOETF_API_KEY", None)
        try:
            with self.assertRaises(CryptoETFError) as ctx:
                CryptoETF()
            self.assertIn("cryptoetf.today/en/console/keys", ctx.exception.message)
        finally:
            if saved:
                os.environ["CRYPTOETF_API_KEY"] = saved

    def test_paths_headers_rate_limit(self):
        t = fake(200, {"symbol": "BTC", "days": []}, {
            "X-RateLimit-Limit": "120", "X-RateLimit-Remaining": "119", "X-RateLimit-Reset": "1700000000",
        })
        etf = CryptoETF("k1", base_url="https://example.test/api/v1/", transport=t)
        self.assertEqual(etf.flows.funds("btc")["symbol"], "BTC")
        self.assertEqual(t.calls[0][0], "https://example.test/api/v1/flows/btc/funds")
        self.assertEqual(t.calls[0][1]["Authorization"], "Bearer k1")
        self.assertEqual(etf.rate_limit, {"limit": 120, "remaining": 119, "reset": 1700000000})
        etf.funds("sol")
        self.assertEqual(t.calls[1][0], "https://example.test/api/v1/funds?asset=sol")
        etf.funds()
        self.assertEqual(t.calls[2][0], "https://example.test/api/v1/funds")

    def test_errors(self):
        etf = CryptoETF("k", transport=fake(429, {"statusCode": 429, "message": "Slow down"}, {"Retry-After": "12"}))
        with self.assertRaises(CryptoETFError) as ctx:
            etf.prices()
        self.assertEqual((ctx.exception.status, ctx.exception.retry_after, ctx.exception.message), (429, 12, "Slow down"))

        etf2 = CryptoETF("k", transport=fake(403, {"statusCode": 403, "code": "api_key_suspended", "message": "Suspended"}))
        with self.assertRaises(CryptoETFError) as ctx:
            etf2.cefi()
        self.assertEqual((ctx.exception.status, ctx.exception.code), (403, "api_key_suspended"))

    @unittest.skipIf(os.environ.get("CRYPTOETF_OFFLINE") == "1", "offline")
    def test_live_bad_key(self):
        with self.assertRaises(CryptoETFError) as ctx:
            CryptoETF("invalid-key-for-sdk-test").flows.summary()
        self.assertEqual(ctx.exception.status, 401)

    @unittest.skipUnless(os.environ.get("CRYPTOETF_API_KEY"), "no CRYPTOETF_API_KEY")
    def test_live_real_key(self):
        etf = CryptoETF()
        self.assertGreaterEqual(len(etf.flows.summary()["assets"]), 16)
        self.assertTrue(any(t["symbol"] == "BTC" for t in etf.tickers()))


class PaidDatasetsTest(unittest.TestCase):
    def test_paths(self):
        t = fake(200, {"assets": []})
        etf = CryptoETF("k", base_url="https://example.test/api/v1", transport=t)
        etf.holdings()
        etf.holdings("eth")
        etf.metrics.cost_basis("btc")
        etf.metrics.issuer_revenue()
        etf.metrics.staking("sol")
        etf.metrics.vs_miners()
        etf.fund_snapshots("IBIT")
        etf.etf_prices("fbtc")
        etf.filings.list()
        etf.filings.get("canary-trx-etf")
        etf.institutions.overview()
        etf.institutions.overview("2026Q2")
        etf.institutions.fund("IBIT", period="2026Q2", limit=25)
        etf.institutions.fund("ETHA")
        base = "https://example.test/api/v1"
        self.assertEqual([u.replace(base, "") for u, _ in t.calls], [
            "/holdings",
            "/holdings?asset=eth",
            "/metrics/cost-basis?asset=btc",
            "/metrics/issuer-revenue",
            "/metrics/staking?asset=sol",
            "/metrics/vs-miners",
            "/funds/IBIT/snapshots",
            "/etf-prices/fbtc",
            "/filings",
            "/filings/canary-trx-etf",
            "/institutions",
            "/institutions?period=2026Q2",
            "/institutions/funds/IBIT?period=2026Q2&limit=25",
            "/institutions/funds/ETHA",
        ])

    def test_rwa_paths(self):
        t = fake(200, {"rows": []})
        etf = CryptoETF("k", base_url="https://example.test/v1", transport=t)
        etf.stablecoins.list()
        etf.stablecoins.list("tron")
        etf.stablecoins.history(id=631872)
        etf.stablecoins.get(631872)
        etf.stablecoins.frozen()
        etf.stablecoins.frozen_addresses()
        etf.rwa.overview()
        etf.rwa.flows(7)
        etf.rwa.flow_history()
        etf.rwa.issuers(segment="treasuries")
        etf.rwa.chains()
        etf.rwa.products(segment="gold", limit=100, offset=100)
        etf.rwa.product("ousg", 30)
        etf.rwa.assets(segment="stocks")
        etf.rwa.tokens(address="0xabc")
        etf.rwa.holders("ethereum", "0xabc", 10)
        etf.rwa.premiums()
        etf.rwa.weekends()
        etf.rwa.venues()
        base = "https://example.test/v1"
        self.assertEqual([u.replace(base, "") for u, _ in t.calls], [
            "/stablecoins",
            "/stablecoins?chain=tron",
            "/stablecoins/history?id=631872",
            "/stablecoins/631872",
            "/stablecoins/frozen",
            "/stablecoins/frozen/addresses",
            "/rwa/overview",
            "/rwa/flows?days=7",
            "/rwa/flows/history",
            "/rwa/issuers?segment=treasuries",
            "/rwa/chains",
            "/rwa/products?segment=gold&limit=100&offset=100",
            "/rwa/products/ousg?days=30",
            "/rwa/assets?segment=stocks",
            "/rwa/tokens?address=0xabc",
            "/rwa/tokens/ethereum/0xabc/holders?limit=10",
            "/rwa/premiums",
            "/rwa/weekends",
            "/rwa/venues",
        ])

    def test_plan_required(self):
        t = fake(403, {"statusCode": 403, "error": "Forbidden", "code": "plan_required", "message": "Paid plan"})
        etf = CryptoETF("k", transport=t)
        with self.assertRaises(CryptoETFError) as ctx:
            etf.metrics.staking()
        self.assertEqual(ctx.exception.status, 403)
        self.assertEqual(ctx.exception.code, "plan_required")


    def test_indexes(self):
        t = fake(200, {"index": "WSMI", "current": 17, "date": "2026-11-22", "windowDays": 30, "history": []})
        etf = CryptoETF(api_key="k", transport=t, base_url="https://example.test/v1")
        self.assertEqual(etf.wsmi()["current"], 17)
        etf.stablecoins.index()
        etf.rwa.index()
        paths = [u.split("example.test")[1] for u, _ in t.calls]
        self.assertEqual(paths, ["/v1/index/wsmi", "/v1/index/stablecoins", "/v1/index/rwa"])

if __name__ == "__main__":
    unittest.main()
