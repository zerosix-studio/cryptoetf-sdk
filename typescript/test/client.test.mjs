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
  assert.throws(() => new CryptoETF(), (e) => e instanceof CryptoETFError && /cryptoetf\.today\/en\/console\/keys/.test(e.message));
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

test("builds paths for paid datasets", async () => {
  const f = fakeFetch(200, { assets: [] });
  const etf = new CryptoETF({ apiKey: "k", fetch: f, baseUrl: "https://example.test/api/v1" });
  await etf.holdings();
  await etf.holdings("eth");
  await etf.metrics.costBasis("btc");
  await etf.metrics.issuerRevenue();
  await etf.metrics.staking("sol");
  await etf.metrics.vsMiners();
  await etf.fundSnapshots("IBIT");
  await etf.etfPrices("fbtc");
  await etf.filings.list();
  await etf.filings.get("canary-trx-etf");
  await etf.institutions.overview();
  await etf.institutions.overview("2026Q2");
  await etf.institutions.fund("IBIT", { period: "2026Q2", limit: 25 });
  await etf.institutions.fund("ETHA");
  const base = "https://example.test/api/v1";
  assert.deepEqual(f.calls.map((c) => c.url.replace(base, "")), [
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
  ]);
});

test("builds paths for stablecoins and RWA", async () => {
  const f = fakeFetch(200, { rows: [] });
  const etf = new CryptoETF({ apiKey: "k", fetch: f, baseUrl: "https://example.test/v1" });
  await etf.stablecoins.list();
  await etf.stablecoins.list("tron");
  await etf.stablecoins.history({ id: 631872 });
  await etf.stablecoins.get(631872);
  await etf.stablecoins.frozen();
  await etf.stablecoins.frozenAddresses();
  await etf.rwa.overview();
  await etf.rwa.flows(7);
  await etf.rwa.flowHistory();
  await etf.rwa.issuers({ segment: "treasuries" });
  await etf.rwa.chains();
  await etf.rwa.products({ segment: "gold", limit: 100, offset: 100 });
  await etf.rwa.product("ousg", 30);
  await etf.rwa.assets({ segment: "stocks" });
  await etf.rwa.tokens({ address: "0xabc" });
  await etf.rwa.holders("ethereum", "0xabc", 10);
  await etf.rwa.premiums();
  await etf.rwa.weekends();
  await etf.rwa.venues();
  const base = "https://example.test/v1";
  assert.deepEqual(f.calls.map((c) => c.url.replace(base, "")), [
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
  ]);
});

test("free key on a paid dataset surfaces plan_required", async () => {
  const etf = new CryptoETF({ apiKey: "k", fetch: fakeFetch(403, { statusCode: 403, error: "Forbidden", code: "plan_required", message: "This dataset needs a paid plan." }) });
  await assert.rejects(etf.metrics.staking(), (e) => e instanceof CryptoETFError && e.status === 403 && e.code === "plan_required");
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

test("indexes: wsmi(), stablecoins.index(), rwa.index() hit /index/*", async () => {
  const f = fakeFetch(200, { index: "WSMI", current: 17, date: "2026-11-22", change: 1.5, weekAgo: 17, monthAgo: 39, parts: { etf: 11, stb: 13, rwa: 37 }, weights: { etf: 0.5, stb: 0.3, rwa: 0.2 }, windowDays: 30, history: [] });
  const etf = new CryptoETF({ apiKey: "k", fetch: f, baseUrl: "https://example.test/v1" });
  const w = await etf.wsmi();
  assert.equal(w.current, 17);
  await etf.stablecoins.index();
  await etf.rwa.index();
  assert.deepEqual(f.calls.map((c) => new URL(c.url).pathname), ["/v1/index/wsmi", "/v1/index/stablecoins", "/v1/index/rwa"]);
});
