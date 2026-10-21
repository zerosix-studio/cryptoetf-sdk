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
            self.assertIn("cryptoetf.today/en/profile", ctx.exception.message)
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


if __name__ == "__main__":
    unittest.main()
