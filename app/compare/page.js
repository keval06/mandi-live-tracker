// app/compare/page.js
import { getAllStateTotals } from "@/lib/api/mandi.js";
import { getCachedStateRecords } from "@/lib/api/mandi-cached.js";
import {
  normalizeRecords,
  groupByCommodity,
  avgModalPrice, 
  formatRupee
} from "@/lib/api/utils.js";
import TrendChart from "@/components/TrendChart";

function buildTrend(records, commodity) {
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

export default async function ComparePage({ searchParams }) {
  const sp = await searchParams;
  const state = sp?.state || "";
  const c1 = sp?.c1 || "";
  const c2 = sp?.c2 || "";

  const stateTotals = await getAllStateTotals();

  if (!state) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-6">
        <h1 className="text-lg font-medium text-gray-900 mb-1">
          Compare commodities
        </h1>
        <p className="text-xs text-gray-400 mb-5">
          Select a state to load commodities
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stateTotals.map((s) => (
            <a
              key={s.state}
              href={`/compare?state=${encodeURIComponent(s.state)}`}
              className="bg-white border border-gray-100 rounded-lg p-3 hover:border-[#22863a] transition-colors"
            >
              <p className="text-xs font-medium text-gray-800">{s.state}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {s.total.toLocaleString("en-IN")} records
              </p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Uses cached route handler — instant after first load, no 429 risk
  const { records: raw } = await getCachedStateRecords(state);
  const records = normalizeRecords(raw);
  const grouped = groupByCommodity(records);
  const commodities = [...grouped.keys()].sort();

  const sel1 = c1 || commodities[0] || "";
  const sel2 = c2 || commodities[1] || "";

  function stats(commodity) {
    const recs = grouped.get(commodity) ?? [];
    if (!recs.length) return null;
    return {
      avgPrice: avgModalPrice(recs),
      minPrice: Math.min(...recs.map((r) => r.minPrice)),
      maxPrice: Math.max(...recs.map((r) => r.maxPrice)),
      mandiCount: recs.length,
    };
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-4">
        <a
          href="/compare"
          className="text-[10px] text-gray-400 hover:text-gray-600"
        >
          ← All states
        </a>
        <h1 className="text-lg font-medium text-gray-900">Compare · {state}</h1>
      </div>

      <form className="flex items-center gap-3 mb-6">
        <input type="hidden" name="state" value={state} />
        <select
          name="c1"
          defaultValue={sel1}
          className="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700 outline-none"
        >
          {commodities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="text-gray-300">vs</span>
        <select
          name="c2"
          defaultValue={sel2}
          className="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700 outline-none"
        >
          {commodities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="text-xs bg-[#22863a] text-white px-4 py-1.5 rounded hover:bg-[#1a6b2e] transition-colors"
        >
          Compare
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { c: sel1, s: stats(sel1) },
          { c: sel2, s: stats(sel2) },
        ].map(({ c, s }) => (
          <div
            key={c}
            className="bg-white border border-gray-100 rounded-lg p-4"
          >
            <p className="text-sm font-medium text-gray-900 mb-3">{c || "—"}</p>
            {!s ? (
              <p className="text-xs text-gray-300">No data</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Avg modal", val: formatRupee(s.avgPrice) },
                  { label: "Min price", val: formatRupee(s.minPrice) },
                  { label: "Max price", val: formatRupee(s.maxPrice) },
                  { label: "Mandis", val: s.mandiCount },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-[#22863a]">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TrendChart
          commodity={sel1}
          data={buildTrend(records, sel1)}
          perMandi={buildPerMandi(records, sel1)}
        />
        <TrendChart
          commodity={sel2}
          data={buildTrend(records, sel2)}
          perMandi={buildPerMandi(records, sel2)}
        />
      </div>
    </div>
  );
}
