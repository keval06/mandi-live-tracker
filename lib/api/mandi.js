  // API FACTS (confirmed by testing):
//   - limit param is IGNORED — always returns 10 records per request
//   - Must paginate with offset=0,10,20,... to get all records
//   - Filter by state works: filters[state]=Gujarat
//   - Filter by commodity works: filters[commodity]=Tomato
//
// STRATEGY: always filter by state (required), paginate in batches of 3
// parallel requests with 1500ms delay between batches.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// BUG FIX 1: param was `bACKOFF` (typo) — used as `backoff` inside → ReferenceError on every 429
// BUG FIX 2: was returning `res` (Response object) on exhausted retries — now returns []
// BUG FIX 3: was returning json.records array — but getTotal was calling .ok/.json() on it
//            fetchWithRetry now returns the raw Response so callers can handle it themselves
async function fetchWithRetry(url, retries = 4) {
  let backoff = 10000; // start at 10s — short waits waste retries when IP is blocked
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (res.status === 429 && i < retries - 1) {
      console.warn(`[API] Rate limited. Retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
      backoff *= 2;
      continue;
    }
    return res; // return raw Response — callers handle .ok and .json()
  }
  // All retries exhausted — return a fake failed response
  return {
    ok: false,
    status: 429,
    statusText: "Too Many Requests",
    json: async () => ({}),
  };
}

const BASE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const FORMAT = "json";
const PER_REQ = 10; // API hardcap — always 10 records per request
const BATCH = 1; // sequential — no burst (parallel causes 429 after ~50 req)
const DELAY = 400; // 400ms between requests = 2.5 req/sec, stays under limit

function getApiKey() {
  const key = process.env.DATA_GOV_API_KEY;
  if (!key) throw new Error("DATA_GOV_API_KEY not set in .env.local");
  return key;
}

function buildUrl(filters = {}, offset = 0) {
  const p = new URLSearchParams({
    "api-key": getApiKey(),
    format: FORMAT,
    limit: "10",
    offset: String(offset),
  });
  for (const [k, v] of Object.entries(filters)) {
    if (v) p.append(`filters[${k}]`, v);
  }
  return `${BASE}?${p}`;
}

// Get total record count for a filter set (one cheap request)
// BUG FIX: was calling res.ok / res.json() on the returned array from old fetchWithRetry
// Now fetchWithRetry returns a Response so this works correctly
async function getTotal(filters = {}) {
  const url = buildUrl(filters, 0);
  console.log(
    `[API] Fetching Total: ${url.replace(/api-key=[^&]+/, "api-key=***")}`,
  );

  const res = await fetchWithRetry(url);

  if (!res.ok) {
    console.error(`[API] Total Fetch Error: ${res.status} ${res.statusText}`);
    return { total: 0, first: [] };
  }

  try {
    const json = await res.json();
    return { total: Number(json.total) || 0, first: json.records ?? [] };
  } catch (e) {
    console.error(`[API] Total Parsing Error: ${e.message}`);
    return { total: 0, first: [] };
  }
}

// Fetch one page — BUG FIX: now uses fetchWithRetry instead of bare fetch
async function fetchPage(filters, offset) {
  const url = buildUrl(filters, offset);
  const res = await fetchWithRetry(url);

  if (!res.ok) {
    if (res.status === 429) {
      console.warn(
        `[API] Rate limit hit at offset ${offset} after retries. Skipping.`,
      );
    } else {
      console.error(
        `[API] Error ${res.status} at offset ${offset}: ${res.statusText}`,
      );
    }
    return [];
  }

  try {
    const json = await res.json();
    return json.records ?? [];
  } catch (e) {
    console.error(`[API] Failed to parse JSON at offset ${offset}`);
    return [];
  }
}

// Fetch ALL records — sequential with DELAY between each request (no burst = no 429)
async function fetchAll(filters = {}) {
  const { total, first } = await getTotal(filters);
  if (!total) return { records: first, total: 0 };

  const offsets = [];
  for (let o = PER_REQ; o < total; o += PER_REQ) offsets.push(o);

  console.log(
    `[Fetch] Total: ${total}. Fetching ${offsets.length} more pages sequentially...`,
  );

  const allRecords = [...first];
  for (let i = 0; i < offsets.length; i++) {
    const start = Date.now();
    const records = await fetchPage(filters, offsets[i]);
    const duration = Date.now() - start;
    
    allRecords.push(...records);
    
    // Only sleep if it was a real network request. 
    // If < 50ms, the fetch was served from the Next.js cache.
    if (duration > 50) {
      await sleep(DELAY);
    }
  }

  console.log(`[Fetch] Done. Fetched: ${allRecords.length} / ${total}`);
  return { records: allRecords, total };
}

// ── date filter ───────────────────────────────────────────────────────────────
// arrival_date = "08/04/2026" (dd/mm/yyyy)

export function filterByRange(records, range) {
  if (!range || range === "This Week") return records;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (range === "Today") {
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const str = `${dd}/${mm}/${yyyy}`;
    return records.filter((r) => r.arrival_date === str);
  }
  if (range === "Monthly") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return records.filter((r) => {
      if (!r.arrival_date) return false;
      const [dd, mm, yyyy] = r.arrival_date.split("/");
      return new Date(`${yyyy}-${mm}-${dd}`) >= cutoff;
    });
  }
  return records;
}

// ── public API ────────────────────────────────────────────────────────────────

export async function getPricesByState(state, { commodity } = {}) {
  if (!state) throw new Error("state is required");
  return fetchAll({ state, commodity });
}

// BUG FIX: was firing all 33 state requests in parallel — guaranteed 429 storm
// Now fetches in sequential batches of 5 with a delay
export async function getAllStateTotals() {
  const STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Jammu and Kashmir",
    "Ladakh",
    "Delhi",
    "Puducherry",
    "Chandigarh",
  ];

  const STATE_BATCH = 5;
  const results = [];

  for (let i = 0; i < STATES.length; i += STATE_BATCH) {
    const batch = STATES.slice(i, i + STATE_BATCH);
    const start = Date.now();
    
    const batchResults = await Promise.all(
      batch.map(async (state) => {
        const { total } = await getTotal({ state });
        return { state, total };
      }),
    );
    
    const duration = Date.now() - start;
    results.push(...batchResults);
    
    // Only sleep if it was a real network request.
    if (i + STATE_BATCH < STATES.length && duration > 50) {
      await sleep(1000);
    }
  }

  return results.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
}

// Commodity list for a state
export async function getCommoditiesForState(state) {
  const { records } = await fetchAll({ state });
  return [...new Set(records.map((r) => r.commodity).filter(Boolean))].sort();
}

// Top movers — spread between highest and lowest modal price per commodity
export async function getTopMovers(state, limit = 8) {
  const { records } = await fetchAll({ state });
  const map = {};
  for (const r of records) {
    if (!r.commodity || !r.modal_price) continue;
    if (!map[r.commodity]) map[r.commodity] = [];
    map[r.commodity].push(r.modal_price);
  }
  return Object.entries(map)
    .filter(([, p]) => p.length >= 2)
    .map(([commodity, prices]) => {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const spread = +(((max - min) / avg) * 100).toFixed(1);
      return {
        commodity,
        minPrice: min,
        maxPrice: max,
        avgPrice: avg,
        spread,
        mandiCount: prices.length,
      };
    })
    .sort((a, b) => b.spread - a.spread)
    .slice(0, limit);
}

// Dashboard stats
export async function getDashboardStats() {
  const stateTotals = await getAllStateTotals();
  const total = stateTotals.reduce((s, st) => s + st.total, 0);
  return {
    totalRecords: total,
    uniqueStates: stateTotals.length,
    activeStates: stateTotals,
  };
}

//? Quick preview: Gets total count, first 10 records, and a list of mandis in that first page

export async function getFirstPage(state) {
  if (!state) throw new Error("state is required");

  const { total, first } = await getTotal({ state });

  // Extract unique mandi names from the first page of results
  const mandis = [
    ...new Set(first.map((r) => r.market).filter(Boolean)),
  ].sort();

  return {
    records: first,
    total,
    mandis,
  };
}

// Fetch all records for a specific mandi within a state
export async function getPricesByMandi(state, mandi, { commodity } = {}) {
  if (!state || !mandi) throw new Error("state and mandi are required");

  // CRITICAL FIX: The data.gov.in API completely ignores `filters[market]`.
  // If we include `market` in the API URL, Next.js sees a "brand new URL"
  // and completely bypasses the state cache, causing a 15-second stall EVERY single
  // time you click a different mandi!
  // By omitting `market` from the fetch, we force all mandis in the state
  // to share the exact same cached State-level response.
  // The `.filter` rule we added inside `app/page.js` will handle isolating the mandi.
  return fetchAll({ state, commodity });
}
