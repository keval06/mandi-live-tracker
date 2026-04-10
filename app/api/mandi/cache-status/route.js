// app/api/mandi/cache-status/route.js
// Hit this in browser to see what's cached and how old it is
// e.g. http://localhost:3000/api/mandi/cache-status

import { getCacheStatus } from '@/lib/api/mandi-cached.js'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(getCacheStatus())
}