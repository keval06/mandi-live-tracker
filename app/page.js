import { Suspense } from "react";
import {
  getFirstPage,
  getPricesByMandi,
  getTopMovers,
  filterByRange,
} from "@/lib/api/mandi.js";
import { getCachedStateRecords, getCachedStateTotals } from "@/lib/api/mandi-cached.js";
import {
  normalizeRecords,
  groupByCommodity,
  avgModalPrice,
} from "@/lib/api/utils.js";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import PriceTable from "@/components/PriceTable";
import TrendChart from "@/components/TrendChart";
import StateSelector from "@/components/StateSelector";
import MandiSelector from "@/components/MandiSelector";

// Dynamic category matching — regex based, handles all API name variants
// e.g. "Cummin Seed(Jeera)", "Bajra(Pearl Millet/Cumbu)", "Mango(Raw-Ripe)"
// Add patterns here as new commodities appear — no need to list every variant
const CATEGORY_PATTERNS = {
  Vegetables:
    /tomato|onion|potato|cabbage|capsicum|brinjal|cauliflower|carrot|bitter.?gourd|bhindi|ladies.?finger|bottle.?gourd|beans|beetroot|ridgeguard|tori|pumpkin|drumstick|spinach|cucumber/i,
  Cereals: /wheat|maize|rice|barley|jowar|bajra|paddy|sorghum|ragi|millet/i,
  Pulses: /gram|moong|arhar|tur|urad|masoor|lentil|peas|rajma|moth/i,
  Spices:
    /garlic|ginger|turmeric|chilli|coriander|cumin|jeera|ajwan|pepper|cardamom|clove|fennel|fenugreek|methi/i,
  Fruits:
    /apple|guava|orange|banana|mango|grape|pomegranate|papaya|watermelon|melon|lemon|lime|pineapple|pear|plum|peach/i,
  Oilseeds:
    /castor|mustard|groundnut|sunflower|soybean|sesamum|sesame|linseed|safflower/i,
};

// Assign commodity to a category dynamically
function getCommodityCategory(commodity) {
  for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(commodity)) return cat;
  }
  return "Other";
}

// Build category counts from actual records — shows only what exists in data
function buildCategories(records) {
  const counts = {};
  for (const r of records) {
    const cat = getCommodityCategory(r.commodity);
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({ cat, count }));
}

function buildTrendData(records, commodity) {
  const byDate = {};
  for (const r of records) {
    if (r.commodity !== commodity) continue;
    if (!byDate[r.arrivalDate]) byDate[r.arrivalDate] = [];
    byDate[r.arrivalDate].push(r.modalPrice);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => {
      const ms = (s) => {
        const [d, m, y] = s.split("/");
        return new Date(`${y}-${m}-${d}`).getTime();
      };
      return ms(a) - ms(b);
    })
    .map(([date, prices]) => ({
      date,
      avgPrice: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
    }));
}

function buildPerMandi(records, commodity) {
  return records
    .filter((r) => r.commodity === commodity && r.modalPrice > 0)
    .sort((a, b) => b.modalPrice - a.modalPrice)
    .map((r) => ({ market: r.market, modalPrice: r.modalPrice }));
}

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const state = sp?.state || "";
  const mandi = sp?.mandi || "";
  const category = sp?.category || "";
  const range = sp?.range || "This Week";

  // Always cheap — 33 requests batched, cached
  const stateTotals = await getCachedStateTotals();
  const states = stateTotals.map((s) => s.state);
  const totalNation = stateTotals.reduce((s, st) => s + st.total, 0);

  // No state selected — show landing
  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-100 rounded-lg px-5 py-5 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-2.5 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22863a] animate-pulse" />
            <span className="text-[10px] text-[#22863a] font-medium">
              Live · data.gov.in · Updated daily
            </span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">
            India Mandi Price Tracker
          </h1>
          <p className="text-xs text-gray-400 mb-4">
            {totalNation.toLocaleString("en-IN")} records across {states.length}{" "}
            states · Select a state to view prices
          </p>
        </div>
        <StateSelector stateTotals={stateTotals} />
      </div>
    );
  }

  // State selected, no mandi yet — 1 cheap request to get mandi list + preview
  if (!mandi) {
    // Use cached full state fetch to get ALL mandis, not just first page
    const [{ records: allRecords, total }, { records: firstRecords }] = await Promise.all([
      getCachedStateRecords(state),
      getFirstPage(state),
    ]);
    const mandiCounts = {};
    for (const r of allRecords) {
      if (!r.market) continue;
      mandiCounts[r.market] = (mandiCounts[r.market] || 0) + 1;
    }
    const mandis = Object.keys(mandiCounts).sort();
    const statInfo = stateTotals.find((s) => s.state === state);

    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <a
              href="/"
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              ← All states
            </a>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{state}</h1>
          <p className="text-xs text-gray-400">
            {statInfo?.total.toLocaleString("en-IN")} total records · Select a
            mandi to view prices
          </p>
        </div>

        {/* Mandi picker — clicking navigates to ?state=X&mandi=Y */}
        <MandiSelector state={state} mandis={mandis} mandiCounts={mandiCounts} totalRecords={total} />

        {/* Preview — first 10 records while user picks */}
        {firstRecords.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">
              Preview (first 10 records)
            </p>
            <PriceTable records={normalizeRecords(firstRecords)} />
          </div>
        )}
      </div>
    );
  }

  // State + Mandi selected — CHEAP fetch: 1-5 requests for that mandi only
  const [{ records: raw }, movers] = await Promise.all([
    getPricesByMandi(state, mandi),
    // TopMovers also needs all state records — skip it here, show only mandi data
    // If you want movers, add a separate cached route handler
    Promise.resolve([]),
  ]);

  const rangeFiltered = filterByRange(raw, range);
    // Force strict display of ONLY the selected mandi

  const records = normalizeRecords(rangeFiltered).filter((r) => r.market === mandi);

  // Dynamic categories from actual data
  const categories = buildCategories(records);

  const filtered =
    category && category !== "All"
      ? records.filter((r) => getCommodityCategory(r.commodity) === category)
      : records;

  const grouped = groupByCommodity(filtered);
  const topEntries = Array.from(grouped.entries())
    .map(([commodity, recs]) => ({ commodity, avg: avgModalPrice(recs), recs }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  const cardRecords = topEntries.map((e) => e.recs[0]);
  const trendCommodity = topEntries[0]?.commodity ?? "";
  const trendData = trendCommodity
    ? buildTrendData(records, trendCommodity)
    : [];
  const perMandiData = trendCommodity
    ? buildPerMandi(records, trendCommodity)
    : [];
  const statInfo = stateTotals.find((s) => s.state === state);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Hero */}
      <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 mb-3 flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a
              href="/"
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              ← All states
            </a>
            <span className="text-gray-200">|</span>
            <a
              href={`/?state=${encodeURIComponent(state)}`}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              ← {state}
            </a>
            <span className="text-gray-200">|</span>
            <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22863a] animate-pulse" />
              <span className="text-[10px] text-[#22863a] font-medium">
                Live
              </span>
            </div>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{mandi}</h1>
          <p className="text-xs text-gray-400">
            {state} · {records.length} records
          </p>
        </div>
        <div className="flex gap-2">
          {[
            {
              val: new Set(records.map((r) => r.market)).size,
              label: "Mandis",
            },
            {
              val: new Set(records.map((r) => r.commodity)).size,
              label: "Commodities",
            },
            { val: records.length, label: "Records" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-50 rounded-lg px-3 py-2 text-right"
            >
              <p className="text-base font-medium text-gray-900">{s.val}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic category filter — only shows categories present in data */}
      <Suspense>
        <FilterBar
          states={states}
          activeState={state}
          activeMandi={mandi}
          categories={categories}
          activeCategory={category}
          activeRange={range}
        />
      </Suspense>

      {/* Top 3 cards */}
      {cardRecords.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {cardRecords.map((r, i) => (
            <PriceCard key={i} record={r} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg py-6 text-center text-xs text-gray-300 mb-3">
          No records for selected filters
        </div>
      )}

      {/* Chart */}
      {trendCommodity && (
        <div className="mb-3">
          <TrendChart
            commodity={trendCommodity}
            data={trendData}
            perMandi={perMandiData}
          />
        </div>
      )}

      {/* Table */}
      <PriceTable records={filtered} />
    </div>
  );
}