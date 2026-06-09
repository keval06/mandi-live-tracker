// app/api/mandi/state/[state]/route.js
//
// Route handler — uses in-process cache from mandi-cached.js
// First call: slow (full paginator runs)
// Subsequent calls within 15min: instant (memory cache hit)
//
// Also sets HTTP Cache-Control so CDN/browser caches the JSON response.

import { getCachedStateRecords } from '@/lib/api/mandi-cached.js'
import { NextResponse } from 'next/server'

// Note: do NOT use `export const revalidate` here — it doesn't cache
// the HTTP response, only controls internal fetch() cache which is
// unreliable for self-calls. We handle caching in mandi-cached.js instead.

export async function GET(request, { params }) {
  const { state } = await params
  const { searchParams } = new URL(request.url)
  const commodity = searchParams.get('commodity') || undefined

  if (!state) {
    return NextResponse.json({ error: 'state is required' }, { status: 400 })
  }

  try {
    const { records, total } = await getCachedStateRecords(
      decodeURIComponent(state),
      { commodity }
    )

    return NextResponse.json(
      { records, total },
      {
        headers: {
          // CDN/browser caches for 15min, serves stale while revalidating
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    )
  } catch (e) {
    console.error(`[Route] Failed for state=${state}:`, e.message, "[app/api/mandi/state/[state]/route.js]")
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}