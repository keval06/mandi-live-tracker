// lib/api/mandi-cached.js
//
// In-process memory cache for state records.
// Works in both dev and prod — no BASE_URL needed, no fetch cache quirks.
//
// How it works:
//   First call for a state → runs full paginator (slow, 30-60s for large states)
//   Any call within TTL  → returns from memory instantly (0ms)
//   After TTL expires    → re-fetches on next call
//
// TTL = 15 minutes (data.gov.in updates daily, 15min is fine)

import { getPricesByState, getAllStateTotals } from './mandi.js'

const TTL = 6 * 60 * 60 * 1000 // 6 hours — data.gov.in updates once daily

// New in-memory store — separate from the per-state records cache
let stateTotalsCache = null;
let stateTotalsFetchedAt = 0;

export async function getCachedStateTotals() {
  const age = Date.now() - stateTotalsFetchedAt
  
  // Cache hit — TTL = 6 hours
  if (stateTotalsCache && age < TTL) {
    console.log(`[Cache] HIT — stateTotals (${Math.round(age/1000)}s old)`, "[lib/api/mandi-cached.js]")
    return stateTotalsCache
  }
  // Cache miss — fetch all 33 state totals (33 API calls, once per 6 hours)
  console.log(`[Cache] MISS — stateTotals. Fetching from API...`, "[lib/api/mandi-cached.js]")
  stateTotalsCache = await getAllStateTotals()
  stateTotalsFetchedAt = Date.now()
  console.log(`[Cache] STORED — stateTotals (${stateTotalsCache.length} states)`, "[lib/api/mandi-cached.js]")
  return stateTotalsCache
}


// Map<cacheKey, { records, total, fetchedAt }>
const cache = new Map()

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// Key includes today's date — yesterday's cache entry is automatically ignored
function cacheKey(state, commodity) {
  const base = commodity ? `${state}::${commodity}` : state
  return `${base}::${todayStr()}`
}

function isStale(entry) {
  return Date.now() - entry.fetchedAt > TTL
}

export async function getCachedStateRecords(state, { commodity } = {}) {
  const key = cacheKey(state, commodity)
  const entry = cache.get(key)

  if (entry && !isStale(entry)) {
    const age = Math.round((Date.now() - entry.fetchedAt) / 1000)
    console.log(`[Cache] HIT — ${key} (${age}s old, ${entry.records.length} records)`, "[lib/api/mandi-cached.js]")
    return { records: entry.records, total: entry.total }
  }

  console.log(`[Cache] MISS — ${key}. Fetching from API...`, "[lib/api/mandi-cached.js]")
  const result = await getPricesByState(state, { commodity })

  cache.set(key, {
    records:   result.records,
    total:     result.total,
    fetchedAt: Date.now(),
  })

  console.log(`[Cache] STORED — ${key} (${result.records.length} records)`, "[lib/api/mandi-cached.js]")
  return result
}

// Force-invalidate a state (useful if you add a refresh button)
export function invalidateCache(state, { commodity } = {}) {
  const key = cacheKey(state, commodity)
  cache.delete(key)
  console.log(`[Cache] INVALIDATED — ${key}`, "[lib/api/mandi-cached.js]")
}

// Debug: see what's cached
export function getCacheStatus() {
  return Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    records: entry.records.length,
    age: Math.round((Date.now() - entry.fetchedAt) / 1000) + 's',
    stale: isStale(entry),
  }))
}