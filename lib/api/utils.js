// lib/utils.js
// Pure helper functions — no API calls.
// Safe to import in server components, client components, and route handlers.
//
// NOTE: data.gov.in API returns min_price, max_price, modal_price as numbers already.
//       arrival_date is a string in dd/mm/yyyy format e.g. "07/04/2026"

// ─── currency ─────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees per quintal.
 * formatRupee(1050)  → "₹1,050"
 * formatRupee(12500) → "₹12,500"
 */
export function formatRupee(value) {
  if (value == null || isNaN(value)) return "—";
  return "₹" + Number(value).toLocaleString("en-IN");
}

/**
 * Short format — for tight spaces.
 * formatRupeeShort(120000) → "₹1.2L"
 * formatRupeeShort(2500)   → "₹2.5K"
 * formatRupeeShort(800)    → "₹800"
 */
export function formatRupeeShort(value) {
  const n = Number(value);
  if (isNaN(n)) return "—";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n;
}

// ─── percentage change ────────────────────────────────────────────────────────

/**
 * Compute % change from prev to curr.
 * percentChange(1000, 1120) → 12
 * percentChange(0, 100)     → null
 */
export function percentChange(prev, curr) {
  const p = Number(prev);
  const c = Number(curr);
  if (!p || isNaN(p) || isNaN(c)) return null;
  return Math.round(((c - p) / p) * 1000) / 10; // 1 decimal place
}

/**
 * Format percent change for display.
 * formatChange(12.4)  → "+12.4%"
 * formatChange(-3.1)  → "-3.1%"
 * formatChange(null)  → "—"
 */
export function formatChange(val) {
  if (val == null) return "—";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val}%`;
}

/**
 * Tailwind color classes based on direction of change.
 * Returns { text, bg, border }
 */
export function changeColors(val) {
  if (val == null)
    return {
      text: "text-zinc-400",
      bg: "bg-zinc-100",
      border: "border-zinc-200",
    };
  if (val > 0)
    return {
      text: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    };
  if (val < 0)
    return { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  return {
    text: "text-zinc-500",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
  };
}

// ─── dates ────────────────────────────────────────────────────────────────────

/**
 * Parse dd/mm/yyyy → Date object (handles real API format "07/04/2026").
 * Returns null if invalid.
 */
export function parseMandiDate(dateStr) {
  if (!dateStr) return null;
  const [dd, mm, yyyy] = dateStr.split("/");
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  return isNaN(d) ? null : d;
}

/**
 * Format dd/mm/yyyy string for display.
 * "07/04/2026" → "07 Apr 2026"
 */
export function formatDate(dateStr) {
  const d = parseMandiDate(dateStr);
  if (!d) return dateStr ?? "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Relative date label.
 * "07/04/2026" → "Today" / "Yesterday" / "07 Apr 2026"
 */
export function relativeDate(dateStr) {
  const d = parseMandiDate(dateStr);
  if (!d) return "—";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return formatDate(dateStr);
}

// ─── record normalization ─────────────────────────────────────────────────────

/**
 * Normalize a single raw API record to a clean typed object.
 *
 * IMPORTANT: min_price, max_price, modal_price come from the API as numbers.
 * No conversion needed — but we guard with || 0 for safety.
 *
 * Raw → Normalized:
 *   arrival_date  → arrivalDate  (kept as dd/mm/yyyy string)
 *   min_price     → minPrice     (number)
 *   max_price     → maxPrice     (number)
 *   modal_price   → modalPrice   (number)
 */
export function normalizeRecord(raw) {
  return {
    state: raw.state || "",
    district: raw.district || "",
    market: raw.market || "",
    commodity: raw.commodity || "",
    variety: raw.variety || "",
    grade: raw.grade || "",
    arrivalDate: raw.arrival_date || "",
    minPrice: raw.min_price || 0, // already a number
    maxPrice: raw.max_price || 0,
    modalPrice: raw.modal_price || 0,
  };
}

/**
 * Normalize an array of raw records.
 */
export function normalizeRecords(raws = []) {
  return raws.map(normalizeRecord);
}

// ─── grouping ─────────────────────────────────────────────────────────────────

/**
 * Group normalized records by commodity.
 * Returns Map<string, NormalizedRecord[]>
 */
export function groupByCommodity(records) {
  const map = new Map();
  for (const r of records) {
    if (!r.commodity) continue;
    const list = map.get(r.commodity) ?? [];
    list.push(r);
    map.set(r.commodity, list);
  }
  return map;
}

/**
 * Group normalized records by state.
 * Returns Map<string, NormalizedRecord[]>
 */
export function groupByState(records) {
  const map = new Map();
  for (const r of records) {
    if (!r.state) continue;
    const list = map.get(r.state) ?? [];
    list.push(r);
    map.set(r.state, list);
  }
  return map;
}

/**
 * Average modal price from an array of normalized records.
 */
export function avgModalPrice(records) {
  if (!records.length) return 0;
  return Math.round(
    records.reduce((acc, r) => acc + r.modalPrice, 0) / records.length
  );
}

// ─── misc ─────────────────────────────────────────────────────────────────────

/**
 * URL-safe slug.
 * "Green Chilli" → "green-chilli"
 * "Ridgeguard(Tori)" → "ridgeguardtori"
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Top N commodities by avg modal price from a record array.
 * Used on the compare and states pages.
 */
export function topCommoditiesByPrice(records, n = 10) {
  const grouped = groupByCommodity(records);
  return Array.from(grouped.entries())
    .map(([commodity, recs]) => ({
      commodity,
      avgPrice: avgModalPrice(recs),
      mandiCount: recs.length,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, n);
}

/**
 * Clamp a number between min and max.
 * Used for price bar widths on cards.
 * clamp(1050, 800, 1300) → 50  (% position between min and max)
 */
export function priceBarPercent(modal, min, max) {
  if (max === min) return 50;
  return Math.round(((modal - min) / (max - min)) * 100);
}
