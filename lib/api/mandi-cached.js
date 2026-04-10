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

import { getPricesByState } from './mandi.js'

const TTL = 15 * 60 * 1000 // 15 minutes in ms

// Map<cacheKey, { records, total, fetchedAt }>
const cache = new Map()

function cacheKey(state, commodity) {
  return commodity ? `${state}::${commodity}` : state
}

function isStale(entry) {
  return Date.now() - entry.fetchedAt > TTL
}

export async function getCachedStateRecords(state, { commodity } = {}) {
  const key = cacheKey(state, commodity)
  const entry = cache.get(key)

  if (entry && !isStale(entry)) {
    const age = Math.round((Date.now() - entry.fetchedAt) / 1000)
    console.log(`[Cache] HIT — ${key} (${age}s old, ${entry.records.length} records)`)
    return { records: entry.records, total: entry.total }
  }

  console.log(`[Cache] MISS — ${key}. Fetching from API...`)
  const result = await getPricesByState(state, { commodity })

  cache.set(key, {
    records:   result.records,
    total:     result.total,
    fetchedAt: Date.now(),
  })

  console.log(`[Cache] STORED — ${key} (${result.records.length} records)`)
  return result
}

// Force-invalidate a state (useful if you add a refresh button)
export function invalidateCache(state, { commodity } = {}) {
  const key = cacheKey(state, commodity)
  cache.delete(key)
  console.log(`[Cache] INVALIDATED — ${key}`)
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