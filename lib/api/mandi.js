// API FACTS (confirmed by testing):
//   - limit param is IGNORED — always returns 10 records per request
//   - Must paginate with offset=0,10,20,... to get all records
//   - Filter by state works: filters[state]=Gujarat
//   - Filter by commodity works: filters[commodity]=Tomato
//
// STRATEGY: always filter by state (required), paginate in batches of 50
// parallel requests. Gujarat(906)=2 batches, TN(7447)=15 batches.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchWithRetry(url, retries = 3, bACKOFF = 2000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      next: { revalidate: 900 },
    });
    if (res.status === 429 && i < retries - 1) {
      console.warn(`[API] Busy. Retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
      backoff *= 2;
      continue;
    }
    if (!res.ok) {
      console.error(
        `[API] Error ${res.status} at offset ${offset}: ${res.statusText}`,
      );
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
  return res;
}

const BASE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const FORMAT = "json";
const PER_REQ = 10; // API hardcap — always 10 records per request
const BATCH = 3; // parallel requests per batch
const DELAY = 1500;

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

// Get total record count for a filter (one cheap request)
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

// Fetch one page
async function fetchPage(filters, offset) {
  const url = buildUrl(filters, offset);
  const res = await fetch(url, {
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    if (res.status === 429) {
      console.warn(
        `[API] Rate limit hit at offset ${offset}. Returning empty for now.`,
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

// Fetch ALL records for a filter set.
// Paginates in batches of 5 parallel requests.
async function fetchAll(filters = {}) {
  const { total, first } = await getTotal(filters);
  if (!total) return { records: first, total: 0 };

  // Build all offsets needed: 10, 20, 30, ... total
  const offsets = [];
  for (let o = PER_REQ; o < total; o += PER_REQ) offsets.push(o);

  console.log(
    `[Fetch] Total records: ${total}. Need to fetch ${offsets.length} more pages.`,
  );

  // Fetch in batches of BATCH parallel requests
  const allRecords = [...first];
  for (let i = 0; i < offsets.length; i += BATCH) {
    const batch = offsets.slice(i, i + BATCH);
    console.log(
      `[Fetch] Batch ${Math.floor(i / BATCH) + 1} offset: ${batch[0]}...`,
    );
    const pages = await Promise.all(batch.map((o) => fetchPage(filters, o)));
    allRecords.push(...pages.flat());

    if (i + BATCH < offsets.length) {
      await sleep(DELAY);
    }
  }

  console.log(`[Fetch] Completed. Total fetched: ${allRecords.length}`);
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

// STATE IS REQUIRED for performance — always pass a state
export async function getPricesByState(state, { commodity } = {}) {
  if (!state) throw new Error("state is required");
  return fetchAll({ state, commodity });
}

// Get total count per state (cheap — 1 request each, run in parallel)
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
  const results = await Promise.all(
    STATES.map(async (state) => {
      const { total } = await getTotal({ state });
      return { state, total };
    }),
  );
  return results.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
}

// Commodity list for a state (from first-page records, cheap)
export async function getCommoditiesForState(state) {
  const { records } = await fetchAll({ state });
  return [...new Set(records.map((r) => r.commodity).filter(Boolean))].sort();
}

// Top movers for a state — spread between highest and lowest modal price per commodity
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

// Dashboard stats — uses getAllStateTotals (all parallel, fast)
export async function getDashboardStats() {
  const stateTotals = await getAllStateTotals();
  const total = stateTotals.reduce((s, st) => s + st.total, 0);
  return {
    totalRecords: total,
    uniqueStates: stateTotals.length,
    activeStates: stateTotals,
  };
}
