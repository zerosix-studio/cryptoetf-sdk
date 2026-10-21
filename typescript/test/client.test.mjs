import { test } from "node:test";
import assert from "node:assert/strict";
import { CryptoETF, CryptoETFError } from "../dist/index.js";

function fakeFetch(status, body, headers = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
  };
  fn.calls = calls;
  return fn;
}

test("requires an API key", () => {
  const saved = process.env.CRYPTOETF_API_KEY;
  delete process.env.CRYPTOETF_API_KEY;
  assert.throws(() => new CryptoETF(), (e) => e instanceof CryptoETFError && /cryptoetf\.today\/en\/profile/.test(e.message));
  if (saved) process.env.CRYPTOETF_API_KEY = saved;
});

test("sends the key and builds paths", async () => {
  const f = fakeFetch(200, { symbol: "BTC", asset: "bitcoin", windowDays: 30, days: [], updatedAt: "x" }, {
    "x-ratelimit-limit": "120", "x-ratelimit-remaining": "119", "x-ratelimit-reset": "1700000000",
  });
  const etf = new CryptoETF({ apiKey: "k1", fetch: f, baseUrl: "https://example.test/api/v1/" });
  const r = await etf.flows.funds("btc");
  assert.equal(r.symbol, "BTC");
  assert.equal(f.calls[0].url, "https://example.test/api/v1/flows/btc/funds");
  assert.equal(f.calls[0].init.headers.Authorization, "Bearer k1");
  assert.deepEqual(etf.rateLimit, { limit: 120, remaining: 119, reset: 1700000000 });

  await etf.funds("sol");
  assert.equal(f.calls[1].url, "https://example.test/api/v1/funds?asset=sol");
  await etf.funds();
  assert.equal(f.calls[2].url, "https://example.test/api/v1/funds");
});

test("maps API errors", async () => {
  const etf = new CryptoETF({ apiKey: "k", fetch: fakeFetch(429, { statusCode: 429, error: "Too Many Requests", message: "Slow down" }, { "retry-after": "12" }) });
  await assert.rejects(etf.prices(), (e) => e instanceof CryptoETFError && e.status === 429 && e.retryAfter === 12 && e.message === "Slow down");

  const etf2 = new CryptoETF({ apiKey: "k", fetch: fakeFetch(403, { statusCode: 403, error: "Forbidden", code: "api_key_suspended", message: "Suspended" }) });
  await assert.rejects(etf2.cefi(), (e) => e.status === 403 && e.code === "api_key_suspended");
});

test("live API rejects a bad key with 401", { skip: process.env.CRYPTOETF_OFFLINE === "1" }, async () => {
  const etf = new CryptoETF({ apiKey: "invalid-key-for-sdk-test" });
  await assert.rejects(etf.flows.summary(), (e) => e instanceof CryptoETFError && e.status === 401);
});

test("live API returns data with a real key", { skip: !process.env.CRYPTOETF_API_KEY }, async () => {
  const etf = new CryptoETF();
  const s = await etf.flows.summary();
  assert.ok(s.assets.length >= 16);
  const t = await etf.tickers();
  assert.ok(t.some((x) => x.symbol === "BTC"));
});
